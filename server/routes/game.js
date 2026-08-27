/**
 * server/routes/game.js
 * All game action endpoints. All require active session.
 */

const express    = require('express');
const db         = require('../db');
const { FACTIONS, calcPower, calcEconomy, calcCaravanReward } = require('../gameData');
const { ITEM_CATALOG } = require('../itemData');
const { todayStr, computeStreakReward } = require('../streakReward');
const router     = express.Router();

// ── Auth middleware ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.playerId) return res.status(401).json({ error: 'Not logged in.' });
  next();
}
router.use(requireAuth);

// ── Helpers ───────────────────────────────────────────────────────
async function getFullState(playerId) {
  const player       = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  const buildingRows = await db.all('SELECT * FROM buildings WHERE player_id = ?', [playerId]);
  const armyRows      = await db.all('SELECT * FROM army WHERE player_id = ?', [playerId]);
  const items         = await db.all('SELECT * FROM items WHERE player_id = ? ORDER BY acquired_at DESC LIMIT 20', [playerId]);
  const events        = await db.all('SELECT * FROM event_log WHERE player_id = ? ORDER BY occurred_at DESC LIMIT 30', [playerId]);
  const power         = calcPower(player, buildingRows, armyRows, player.faction);
  const economy       = calcEconomy(player, buildingRows, armyRows, player.faction);
  const caravan       = calcCaravanReward(player, buildingRows, armyRows, player.faction);

  // The frontend expects buildings/army as { id: value } maps, not raw DB rows —
  // calcPower/calcEconomy above need the row arrays, so convert only for the response.
  const buildings = Object.fromEntries(buildingRows.map(b => [b.building_id, b.level]));
  const army      = Object.fromEntries(armyRows.map(a => [a.unit_id, a.quantity]));

  // Frontend reads resource fields (turns/gold/mana/land/...) straight off the state
  // object (gs.turns), not nested under gs.player.turns — spread them at the top level.
  // Never ship the password hash to the client.
  const { password, ...playerSafe } = player;

  const streak = {
    days: player.streak_days || 0,
    chains: player.streak_chains || 0,
    shield: !!player.streak_shield,
    lastDate: player.streak_last_date || null,
    claimedToday: player.streak_last_date === todayStr() ? !!player.streak_reward_claimed : false,
    justBroke: !!player.streak_just_broke,
    justUsedShield: !!player.streak_just_shielded,
  };

  return { player: playerSafe, ...playerSafe, buildings, army, items, events, power, economy, caravan, streak };
}

async function logEvent(playerId, message, category = 'info') {
  await db.run(
    'INSERT INTO event_log (player_id, message, category) VALUES (?, ?, ?)',
    [playerId, message, category]
  );
}

async function updatePower(playerId) {
  const player    = await db.get('SELECT * FROM players WHERE id = ?', [playerId]);
  const buildings = await db.all('SELECT * FROM buildings WHERE player_id = ?', [playerId]);
  const army      = await db.all('SELECT * FROM army WHERE player_id = ?', [playerId]);
  const power     = calcPower(player, buildings, army, player.faction);
  await db.run('UPDATE players SET power = ? WHERE id = ?', [power, playerId]);
  return power;
}

// ── POST /api/game/faction ────────────────────────────────────────
router.post('/faction', async (req, res) => {
  try {
    const { faction } = req.body;
    if (!faction || !FACTIONS[faction]) return res.status(400).json({ error: 'Invalid faction.' });

    const player = await db.get('SELECT faction FROM players WHERE id = ?', [req.session.playerId]);
    if (!player) return res.status(401).json({ error: 'Player not found.' });
    if (player.faction) return res.status(400).json({ error: 'Faction already chosen.' });

    const FIRST_FACTION_GOLD_BONUS = 200;
    const FIRST_FACTION_LAND_BONUS = 5;
    await db.run(
      'UPDATE players SET faction = ?, gold = gold + ?, land = land + ? WHERE id = ?',
      [faction, FIRST_FACTION_GOLD_BONUS, FIRST_FACTION_LAND_BONUS, req.session.playerId]
    );
    await logEvent(req.session.playerId, `Joined the ${FACTIONS[faction].name}. Received +${FIRST_FACTION_GOLD_BONUS}g and +${FIRST_FACTION_LAND_BONUS} acres to start.`, 'info');
    res.json({ ok: true, faction, goldBonus: FIRST_FACTION_GOLD_BONUS, landBonus: FIRST_FACTION_LAND_BONUS });
  } catch (err) {
    console.error('Faction error:', err);
    res.status(500).json({ error: 'Could not set faction.' });
  }
});

// ── GET /api/game/state ───────────────────────────────────────────
router.get('/state', async (req, res) => {
  try {
    const state = await getFullState(req.session.playerId);
    res.json({ ok: true, ...state });
  } catch (err) {
    console.error('State error:', err);
    res.status(500).json({ error: 'Could not load state.' });
  }
});

// ── POST /api/game/streak/claim ─────────────────────────────────────
// Grants today's login-streak reward. Continuity/day-count is advanced
// server-side at login (see server/routes/auth.js touchLoginStreak); this
// endpoint only credits the reward for the day already recorded, once.
router.post('/streak/claim', async (req, res) => {
  try {
    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player) return res.status(401).json({ error: 'Player not found.' });

    const today = todayStr();
    if (player.streak_last_date !== today) {
      return res.status(400).json({ error: 'No streak reward pending today.' });
    }
    if (player.streak_reward_claimed) {
      return res.status(400).json({ error: 'Already claimed today.' });
    }

    const reward = computeStreakReward(player.streak_days || 1, player.streak_chains || 0);
    const newShield = reward.awardShield ? true : !!player.streak_shield;

    await db.run(
      `UPDATE players
         SET gold = gold + ?, mana = mana + ?, land = land + ?, turns = turns + ?,
             streak_shield = ?, streak_reward_claimed = TRUE,
             streak_just_broke = FALSE, streak_just_shielded = FALSE
       WHERE id = ?`,
      [reward.goldAmt, reward.manaAmt, reward.landAmt, reward.turnsAmt, newShield, player.id]
    );
    await logEvent(req.session.playerId, `Day ${player.streak_days} login streak: +${reward.goldAmt}g, +${reward.manaAmt}m${reward.landAmt ? `, +${reward.landAmt} acres` : ''}${reward.turnsAmt ? `, +${reward.turnsAmt} turns` : ''}.`, 'info');

    res.json({ ok: true, reward: { ...reward, streakDay: player.streak_days, chains: player.streak_chains } });
  } catch (err) {
    console.error('Streak claim error:', err);
    res.status(500).json({ error: 'Could not claim streak reward.' });
  }
});

// ── POST /api/game/explore ────────────────────────────────────────
router.post('/explore', async (req, res) => {
  try {
    const { type } = req.body;
    const costs = { scout: 1, caravan: 2, expedition: 3, conquest: 8 };
    const turnCost = costs[type];
    if (!turnCost) return res.status(400).json({ error: 'Invalid explore type.' });

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player.faction) return res.status(400).json({ error: 'Choose a faction first.' });
    if (player.turns < turnCost) return res.status(400).json({ error: `Not enough turns. Need ${turnCost}.` });

    let acres = 0, goldBonus, manaBonus = 0;
    if (type === 'scout')      { acres = Math.floor(Math.random()*11)+5;  goldBonus = 5; }
    // Merchant Caravan trades purely for coin and mana -- no acres. Its
    // payout scales with the player's own current income (see
    // calcCaravanReward) rather than a flat number, so it stays worth
    // taking for a new economy without becoming the obviously-correct
    // move for a developed one.
    if (type === 'caravan') {
      const buildings = await db.all('SELECT * FROM buildings WHERE player_id = ?', [player.id]);
      const army      = await db.all('SELECT * FROM army WHERE player_id = ?', [player.id]);
      ({ goldBonus, manaBonus } = calcCaravanReward(player, buildings, army, player.faction));
    }
    if (type === 'expedition') { acres = Math.floor(Math.random()*31)+20; goldBonus = 20; }
    if (type === 'conquest')   { acres = Math.floor(Math.random()*71)+80; goldBonus = 60; manaBonus = 20; }

    await db.run(
      'UPDATE players SET turns = turns - ?, land = land + ?, gold = gold + ?, mana = mana + ? WHERE id = ?',
      [turnCost, acres, goldBonus, manaBonus, req.session.playerId]
    );
    await updatePower(req.session.playerId);

    const msg = `Explored ${acres} acres. Turn bonus: +${goldBonus}g${manaBonus ? ', +'+manaBonus+'m' : ''}.`;
    await logEvent(req.session.playerId, msg, 'explore');
    res.json({ ok: true, acres, goldBonus, manaBonus, message: msg });
  } catch (err) {
    console.error('Explore error:', err);
    res.status(500).json({ error: 'Explore failed.' });
  }
});

// ── POST /api/game/build ──────────────────────────────────────────
router.post('/build', async (req, res) => {
  try {
    const { buildingId } = req.body;
    if (!buildingId) return res.status(400).json({ error: 'buildingId required.' });

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player.faction) return res.status(400).json({ error: 'Choose a faction first.' });

    const faction = FACTIONS[player.faction];
    const bDef = faction.buildings.find(b => b.id === buildingId);
    if (!bDef) return res.status(400).json({ error: 'Invalid building.' });
    if (player.land === 0) return res.status(400).json({ error: 'You need land before building.' });
    if (player.gold < bDef.goldCost) return res.status(400).json({ error: `Need ${bDef.goldCost} gold.` });
    if (player.mana < bDef.manaCost) return res.status(400).json({ error: `Need ${bDef.manaCost} mana.` });
    if (player.turns < bDef.turns)   return res.status(400).json({ error: `Need ${bDef.turns} turns.` });

    const existing = await db.get(
      'SELECT * FROM buildings WHERE player_id = ? AND building_id = ?',
      [req.session.playerId, buildingId]
    );
    let newLevel;
    if (existing) {
      newLevel = existing.level + 1;
      await db.run(
        'UPDATE buildings SET level = ? WHERE player_id = ? AND building_id = ?',
        [newLevel, req.session.playerId, buildingId]
      );
    } else {
      newLevel = 1;
      await db.run(
        'INSERT INTO buildings (player_id, building_id, level) VALUES (?, ?, 1)',
        [req.session.playerId, buildingId]
      );
    }

    await db.run(
      'UPDATE players SET gold = gold - ?, mana = mana - ?, turns = turns - ? WHERE id = ?',
      [bDef.goldCost, bDef.manaCost, bDef.turns, req.session.playerId]
    );
    await updatePower(req.session.playerId);

    const msg = `Built ${bDef.name} (Lv.${newLevel}). Generating +${bDef.goldGen*newLevel}g/hr, +${bDef.manaGen*newLevel}m/hr.`;
    await logEvent(req.session.playerId, msg, 'build');
    res.json({ ok: true, building: buildingId, buildingName: bDef.name, level: newLevel, message: msg });
  } catch (err) {
    console.error('Build error:', err);
    res.status(500).json({ error: 'Build failed.' });
  }
});

// ── POST /api/game/recruit ────────────────────────────────────────
router.post('/recruit', async (req, res) => {
  try {
    const { unitId, quantity = 5 } = req.body;
    if (!unitId) return res.status(400).json({ error: 'unitId required.' });
    const qty = Math.max(1, Math.min(100, parseInt(quantity) || 5));

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player.faction) return res.status(400).json({ error: 'Choose a faction first.' });

    const faction = FACTIONS[player.faction];
    const uDef = faction.units.find(u => u.id === unitId);
    if (!uDef) return res.status(400).json({ error: 'Invalid unit.' });

    const reqBuilding = await db.get(
      'SELECT level FROM buildings WHERE player_id = ? AND building_id = ?',
      [req.session.playerId, uDef.req]
    );
    if (!reqBuilding || reqBuilding.level < 1)
      return res.status(400).json({ error: `Requires ${uDef.req} to be built first.` });

    const goldCost = uDef.goldCost * qty;
    const manaCost = uDef.manaCost * qty;
    if (player.gold < goldCost) return res.status(400).json({ error: `Need ${goldCost} gold.` });
    if (player.mana < manaCost) return res.status(400).json({ error: `Need ${manaCost} mana.` });
    if (player.turns < 1)       return res.status(400).json({ error: 'Need at least 1 turn.' });

    const existing = await db.get(
      'SELECT quantity FROM army WHERE player_id = ? AND unit_id = ?',
      [req.session.playerId, unitId]
    );
    if (existing) {
      await db.run(
        'UPDATE army SET quantity = quantity + ? WHERE player_id = ? AND unit_id = ?',
        [qty, req.session.playerId, unitId]
      );
    } else {
      await db.run(
        'INSERT INTO army (player_id, unit_id, quantity) VALUES (?, ?, ?)',
        [req.session.playerId, unitId, qty]
      );
    }

    await db.run(
      'UPDATE players SET gold = gold - ?, mana = mana - ?, turns = turns - 1 WHERE id = ?',
      [goldCost, manaCost, req.session.playerId]
    );
    await updatePower(req.session.playerId);

    const msg = `Recruited ${qty}× ${uDef.name}.`;
    await logEvent(req.session.playerId, msg, 'recruit');
    res.json({ ok: true, unit: unitId, unitName: uDef.name, quantity: qty, message: msg });
  } catch (err) {
    console.error('Recruit error:', err);
    res.status(500).json({ error: 'Recruit failed.' });
  }
});

// ── POST /api/game/battle ─────────────────────────────────────────
router.post('/battle', async (req, res) => {
  try {
    const { targetId } = req.body;
    const targetIdInt = parseInt(targetId);
    if (!targetIdInt) return res.status(400).json({ error: 'targetId required.' });

    const attacker = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (attacker.id === targetIdInt)  return res.status(400).json({ error: 'Cannot attack yourself.' });
    if (!attacker.faction)             return res.status(400).json({ error: 'Choose a faction first.' });
    if (attacker.turns < 3)            return res.status(400).json({ error: 'Battle costs 3 turns.' });
    if (attacker.power === 0)          return res.status(400).json({ error: 'Build an army before attacking.' });

    const defender = await db.get('SELECT * FROM players WHERE id = ?', [targetIdInt]);
    if (!defender) return res.status(404).json({ error: 'Target not found.' });

    await db.run('UPDATE players SET turns = turns - 3 WHERE id = ?', [attacker.id]);

    const winChance = attacker.power / (attacker.power + (defender.power || 1) * 0.8);
    const win = Math.random() < winChance;
    const powerRatio = defender.power / (attacker.power || 1);

    let result;
    if (win) {
      const goldGain = Math.round(defender.gold * 0.15 + Math.random() * 50);
      const manaGain = Math.round(defender.mana * 0.10 + Math.random() * 20);
      const landGain = Math.floor(Math.random() * 8) + 2;
      await db.run(
        'UPDATE players SET gold = gold + ?, mana = mana + ?, land = land + ?, victories = victories + 1 WHERE id = ?',
        [goldGain, manaGain, landGain, attacker.id]
      );
      await db.run(
        `UPDATE players SET gold = ${db._type === 'postgres' ? 'GREATEST' : 'MAX'}(0, gold - ?), mana = ${db._type === 'postgres' ? 'GREATEST' : 'MAX'}(0, mana - ?), defeats = defeats + 1 WHERE id = ?`,
        [goldGain, manaGain, defender.id]
      );
      await db.run(
        'INSERT INTO battle_log (attacker_id, defender_id, result, gold_change, mana_change, land_change) VALUES (?, ?, ?, ?, ?, ?)',
        [attacker.id, defender.id, 'victory', goldGain, manaGain, landGain]
      );
      const msg = `Victory over ${defender.name}! Plundered +${goldGain}g, +${manaGain}m, seized ${landGain} acres.`;
      await logEvent(attacker.id, msg, 'battle_win');
      result = { win: true, goldGain, manaGain, landGain, targetName: defender.name, targetFaction: defender.faction, winChance, powerRatio, message: msg };
    } else {
      const goldLoss = Math.round(attacker.gold * 0.08);
      const manaLoss = Math.round(attacker.mana * 0.05);
      await db.run(
        `UPDATE players SET gold = ${db._type === 'postgres' ? 'GREATEST' : 'MAX'}(0, gold - ?), mana = ${db._type === 'postgres' ? 'GREATEST' : 'MAX'}(0, mana - ?), defeats = defeats + 1 WHERE id = ?`,
        [goldLoss, manaLoss, attacker.id]
      );
      await db.run(
        'INSERT INTO battle_log (attacker_id, defender_id, result, gold_change, mana_change, land_change) VALUES (?, ?, ?, ?, ?, ?)',
        [attacker.id, defender.id, 'defeat', -goldLoss, -manaLoss, 0]
      );
      const msg = `Defeated by ${defender.name}. Lost ${goldLoss}g and ${manaLoss}m.`;
      await logEvent(attacker.id, msg, 'battle_loss');
      result = { win: false, goldLoss, manaLoss, targetName: defender.name, targetFaction: defender.faction, winChance, powerRatio, message: msg };
    }

    await updatePower(attacker.id);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Battle error:', err);
    res.status(500).json({ error: 'Battle failed.' });
  }
});

// ── POST /api/game/auction/buy ────────────────────────────────────
// itemId comes from the client's own item catalog (client/src/data/items.js)
// via generateAuction()'s random roll -- ITEM_CATALOG (server/itemData.js)
// is the server's independent mirror of just the fields a purchase needs,
// so price/qty/grants are never trusted from the request itself.
router.post('/auction/buy', async (req, res) => {
  try {
    const { itemId } = req.body;
    const item = ITEM_CATALOG[itemId];
    if (!item) return res.status(400).json({ error: 'Item not found.' });

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (player.gold < item.goldPrice) return res.status(400).json({ error: `Need ${item.goldPrice} gold.` });
    if (player.mana < item.manaPrice) return res.status(400).json({ error: `Need ${item.manaPrice} mana.` });

    await db.run(
      'UPDATE players SET gold = gold - ?, mana = mana - ? WHERE id = ?',
      [item.goldPrice, item.manaPrice, player.id]
    );

    if (item.itemCategory === 'instant') {
      // One-time grant (land/gold/mana/turns) -- applied immediately,
      // never stored as an inventory row. Whitelist the columns a grant
      // can touch since this builds a dynamic SET clause.
      const GRANTABLE = ['land', 'gold', 'mana', 'turns'];
      const sets = [], params = [];
      for (const key of GRANTABLE) {
        const amount = item.instant?.[key];
        if (amount) { sets.push(`${key} = ${key} + ?`); params.push(amount); }
      }
      if (sets.length) {
        params.push(player.id);
        await db.run(`UPDATE players SET ${sets.join(', ')} WHERE id = ?`, params);
      }
      if (item.instant?.land) await updatePower(player.id);
      await logEvent(player.id, `Purchased ${item.name} from the Auction House.`, 'auction');
      return res.json({ ok: true, itemId, item: item.name, itemCategory: 'instant', instant: item.instant });
    }

    // Passive relic, artifact, or consumable -- stored as an inventory row.
    // Consumables stack their charge count onto an existing row instead of
    // creating a duplicate every purchase.
    const existing = await db.get(
      'SELECT id, qty FROM items WHERE player_id = ? AND item_id = ?',
      [player.id, itemId]
    );
    if (existing) {
      await db.run('UPDATE items SET qty = qty + ? WHERE id = ?', [item.qty, existing.id]);
    } else {
      await db.run(
        'INSERT INTO items (player_id, item_id, item_name, qty) VALUES (?, ?, ?, ?)',
        [player.id, itemId, item.name, item.qty]
      );
    }

    await logEvent(player.id, `Purchased ${item.name} from the Auction House.`, 'auction');
    res.json({ ok: true, itemId, item: item.name, itemCategory: item.itemCategory, qty: item.qty });
  } catch (err) {
    console.error('Auction error:', err);
    res.status(500).json({ error: 'Purchase failed.' });
  }
});

// ── GET /api/game/rankings ────────────────────────────────────────
router.get('/rankings', async (req, res) => {
  try {
    // The client windows this list around the requesting player's own rank
    // (Battle tab: +-100, Rankings tab: +-200) to decide who's attackable.
    // With ~250 seeded bots plus real signups, a low-power player is
    // rarely in a small top-N slice -- capping this too low silently
    // dropped that player out of the response entirely, which collapsed
    // the client-side window to nothing (blank Battle/Rankings tabs).
    // 2000 comfortably covers the whole roster for the foreseeable
    // future while still bounding the query.
    const rankings = await db.all(
      'SELECT id, name, faction, power, land, victories, defeats FROM players ORDER BY power DESC LIMIT 2000'
    );
    res.json({ ok: true, rankings, myId: req.session.playerId });
  } catch (err) {
    res.status(500).json({ error: 'Could not load rankings.' });
  }
});

// ── GET /api/game/targets ─────────────────────────────────────────
// Dedicated battle-matchmaking feed: opponents closest to the requesting
// player's own power, regardless of where their overall rank falls. The
// Rankings tab's /rankings list is capped for payload size, so a
// low-power (or, at the other extreme, a #1-ranked) player isn't always
// present in it -- this route never has that problem, since "closest to
// me" is well-defined even when "my position in a capped top-N" isn't.
router.get('/targets', async (req, res) => {
  try {
    const me = await db.get('SELECT power FROM players WHERE id = ?', [req.session.playerId]);
    const myPower = me?.power || 0;

    const targets = await db.all(
      `SELECT id, name, faction, power, land, victories, defeats
         FROM players
        WHERE id != ?
        ORDER BY ABS(power - ?) ASC
        LIMIT 200`,
      [req.session.playerId, myPower]
    );
    // Selected by proximity, but the table reads like a leaderboard slice,
    // so re-sort for display after the proximity cut has been made.
    targets.sort((a, b) => (b.power || 0) - (a.power || 0));

    res.json({ ok: true, targets, myPower });
  } catch (err) {
    console.error('Targets error:', err);
    res.status(500).json({ error: 'Could not load targets.' });
  }
});

module.exports = router;
