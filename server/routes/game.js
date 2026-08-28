/**
 * server/routes/game.js
 * All game action endpoints. All require active session.
 */

const express    = require('express');
const db         = require('../db');
const { FACTIONS, calcPower, calcEconomy, RESOURCE_TIERS, calcResourceTierReward, calcResourceTierPreviews } = require('../gameData');
const { ITEM_CATALOG } = require('../itemData');
const { computeStreakReward } = require('../streakReward');
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
  const resourceTiers = calcResourceTierPreviews(player, buildingRows, armyRows, player.faction);

  // The frontend expects buildings/army as { id: value } maps, not raw DB rows —
  // calcPower/calcEconomy above need the row arrays, so convert only for the response.
  // Mercenary rows stay included here too (so total army counts include them),
  // but they also need their origin faction to render correctly (their
  // unit_id belongs to a foreign faction's roster, not the player's own) --
  // mercs carries that out separately rather than reshaping `army` itself,
  // so every existing native-unit consumer of gs.army keeps working as-is.
  const buildings = Object.fromEntries(buildingRows.map(b => [b.building_id, b.level]));
  const army      = Object.fromEntries(armyRows.map(a => [a.unit_id, a.quantity]));
  const mercs     = armyRows
    .filter(a => a.is_merc)
    .map(a => ({ unitId: a.unit_id, factionId: a.merc_faction, quantity: a.quantity }));

  // Frontend reads resource fields (turns/gold/mana/land/...) straight off the state
  // object (gs.turns), not nested under gs.player.turns — spread them at the top level.
  // Never ship the password hash to the client.
  const { password, ...playerSafe } = player;

  // streak_reward_claimed is reset to FALSE by touchLoginStreak (server/
  // routes/auth.js) exactly when -- and only when -- it advances the
  // player to a new day, so it's already an accurate "claimed for
  // whatever day is currently recorded" flag on its own. Re-deriving
  // "is that day still today" here using the server's own UTC clock (the
  // old behavior) fought with touchLoginStreak's now-local-time day
  // calculation and could report claimedToday:false for a reward that
  // was, in fact, already claimed -- or vice versa.
  const streak = {
    days: player.streak_days || 0,
    chains: player.streak_chains || 0,
    shield: !!player.streak_shield,
    lastDate: player.streak_last_date || null,
    claimedToday: !!player.streak_reward_claimed,
    justBroke: !!player.streak_just_broke,
    justUsedShield: !!player.streak_just_shielded,
  };

  return { player: playerSafe, ...playerSafe, buildings, army, mercs, items, events, power, economy, resourceTiers, streak };
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

// Consumables sorted cheapest-first. A resource-exploration item find picks
// uniformly from the first RESOURCE_TIERS[tier].itemPoolEnd entries of this
// list -- higher tiers reach further into it, so they can find anything a
// lower tier can plus better items a lower tier never reaches, without a
// separate rarity field to keep in sync with the client catalog.
function consumablePool() {
  return Object.entries(ITEM_CATALOG)
    .filter(([, it]) => it.itemCategory === 'consumable')
    .sort((a, b) => a[1].goldPrice - b[1].goldPrice)
    .map(([id]) => id);
}

// Shared by /auction/buy and /explore's item-discovery roll: grants a
// stored item (consumable/artifact/passive), stacking qty onto an existing
// (player_id, item_id) row instead of creating a duplicate.
async function grantOrStackItem(playerId, itemId, qty) {
  const item = ITEM_CATALOG[itemId];
  if (!item) return null;
  const existing = await db.get(
    'SELECT id, qty FROM items WHERE player_id = ? AND item_id = ?',
    [playerId, itemId]
  );
  if (existing) {
    await db.run('UPDATE items SET qty = qty + ? WHERE id = ?', [qty, existing.id]);
  } else {
    await db.run(
      'INSERT INTO items (player_id, item_id, item_name, qty) VALUES (?, ?, ?, ?)',
      [playerId, itemId, item.name, qty]
    );
  }
  return item;
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
    if (!player.streak_last_date) {
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
// Two independent families of explore type, both keyed by an explicit
// `type` string (not inferred from turn cost -- several tiers now share a
// cost, e.g. 'expedition' and 'smuggler' both spend 3 turns):
//   Territory (scout/expedition/conquest) -- claims acres, no resources.
//   Fortune   (peddler/smuggler/caravan)  -- resource tiers from
//     RESOURCE_TIERS (server/gameData.js) -- gold+mana scaled to the
//     player's own income, no acres, plus a small tier-scaled chance of
//     a bonus item find.
const TERRITORY_TIERS = { scout: 1, expedition: 3, conquest: 8 };

router.post('/explore', async (req, res) => {
  try {
    const { type } = req.body;
    const isTerritory = Object.prototype.hasOwnProperty.call(TERRITORY_TIERS, type);
    const isResource  = Object.prototype.hasOwnProperty.call(RESOURCE_TIERS, type);
    if (!isTerritory && !isResource) return res.status(400).json({ error: 'Invalid explore type.' });
    const turnCost = isTerritory ? TERRITORY_TIERS[type] : RESOURCE_TIERS[type].turnCost;

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player.faction) return res.status(400).json({ error: 'Choose a faction first.' });
    if (player.turns < turnCost) return res.status(400).json({ error: `Not enough turns. Need ${turnCost}.` });

    let acres = 0, goldBonus = 0, manaBonus = 0, foundItem = null;

    if (isTerritory) {
      // Acres already rolled in a range -- the accompanying gold/mana
      // bonus used to be a flat constant, which read as blander than the
      // acre roll right next to it. Rolled around the old flat value now
      // (same rough average, real variance) so all three Territory tiers
      // feel consistent with each other and with the Fortune tiers.
      if (type === 'scout')      { acres = Math.floor(Math.random()*11)+5;  goldBonus = Math.floor(Math.random()*7)+3; }
      if (type === 'expedition') { acres = Math.floor(Math.random()*31)+20; goldBonus = Math.floor(Math.random()*19)+12; }
      if (type === 'conquest')   { acres = Math.floor(Math.random()*71)+80; goldBonus = Math.floor(Math.random()*51)+40; manaBonus = Math.floor(Math.random()*19)+12; }
    } else {
      const buildings = await db.all('SELECT * FROM buildings WHERE player_id = ?', [player.id]);
      const army      = await db.all('SELECT * FROM army WHERE player_id = ?', [player.id]);
      ({ goldBonus, manaBonus } = calcResourceTierReward(type, player, buildings, army, player.faction));

      const tier = RESOURCE_TIERS[type];
      if (Math.random() < tier.itemChance) {
        const pool = consumablePool().slice(0, tier.itemPoolEnd);
        if (pool.length) {
          const itemId = pool[Math.floor(Math.random() * pool.length)];
          const item = await grantOrStackItem(player.id, itemId, 1);
          if (item) foundItem = { itemId, name: item.name };
        }
      }
    }

    await db.run(
      'UPDATE players SET turns = turns - ?, land = land + ?, gold = gold + ?, mana = mana + ? WHERE id = ?',
      [turnCost, acres, goldBonus, manaBonus, req.session.playerId]
    );
    // Power only depends on land/buildings/army (see calcPower) -- skip the
    // recompute for pure resource runs, which never change any of those.
    if (acres > 0) await updatePower(req.session.playerId);

    const parts = [];
    if (acres > 0) parts.push(`Explored ${acres} acres`);
    if (goldBonus) parts.push(`+${goldBonus}g`);
    if (manaBonus) parts.push(`+${manaBonus}m`);
    if (foundItem) parts.push(`found ${foundItem.name}!`);
    const msg = (parts.length ? parts.join(', ') : 'Nothing found this time') + '.';
    await logEvent(req.session.playerId, msg, 'explore');
    res.json({ ok: true, acres, goldBonus, manaBonus, foundItem, message: msg });
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

    // Yield roll: cost is always exactly what was quoted (goldCost/manaCost
    // above never vary -- punishing a planned purchase with variance is
    // frustrating, not fun), but the number of recruits granted can come
    // in at or above what was paid for, never below.
    //
    // The client only ever requests qty=5 (no batch-size picker in the UI
    // yet), and a plain percentage roll rounds itself away to nothing at
    // that size: round(5 * 0.15) is already just 1, and the old squared-
    // random distribution landed above that 0.1 threshold only ~18% of the
    // time, so ~4 in 5 recruits came back looking exactly like the flat
    // amount paid for -- not the "spice it up" variance this was meant to
    // add. Using Math.max(1, ...) floors on each non-zero tier below keeps
    // a real 0-bonus outcome as the single most common result (45%) while
    // guaranteeing every OTHER tier is actually visible regardless of qty,
    // instead of being silently rounded back down to it.
    const tierRoll = Math.random();
    let bonusUnits;
    if (tierRoll < 0.45) {
      bonusUnits = 0;
    } else if (tierRoll < 0.85) {
      bonusUnits = Math.max(1, Math.round(qty * (0.05 + Math.random() * 0.10))); // small bump
    } else if (tierRoll < 0.97) {
      bonusUnits = Math.max(2, Math.round(qty * (0.15 + Math.random() * 0.15))); // bigger bump
    } else {
      bonusUnits = Math.max(3, Math.round(qty * (0.30 + Math.random() * 0.20))); // rare surge
    }
    const granted = qty + bonusUnits;

    const existing = await db.get(
      'SELECT quantity FROM army WHERE player_id = ? AND unit_id = ?',
      [req.session.playerId, unitId]
    );
    if (existing) {
      await db.run(
        'UPDATE army SET quantity = quantity + ? WHERE player_id = ? AND unit_id = ?',
        [granted, req.session.playerId, unitId]
      );
    } else {
      await db.run(
        'INSERT INTO army (player_id, unit_id, quantity) VALUES (?, ?, ?)',
        [req.session.playerId, unitId, granted]
      );
    }

    await db.run(
      'UPDATE players SET gold = gold - ?, mana = mana - ?, turns = turns - 1 WHERE id = ?',
      [goldCost, manaCost, req.session.playerId]
    );
    await updatePower(req.session.playerId);

    const msg = bonusUnits > 0
      ? `Recruited ${granted}× ${uDef.name} (+${bonusUnits} bonus recruit${bonusUnits > 1 ? 's' : ''}!).`
      : `Recruited ${granted}× ${uDef.name}.`;
    await logEvent(req.session.playerId, msg, 'recruit');
    res.json({ ok: true, unit: unitId, unitName: uDef.name, quantity: granted, paidFor: qty, bonusUnits, message: msg });
  } catch (err) {
    console.error('Recruit error:', err);
    res.status(500).json({ error: 'Recruit failed.' });
  }
});

// ── POST /api/game/merc/hire ────────────────────────────────────────
// Mercenary listings (client/src/data/mercs.js generateMercListings) are
// randomly rolled entirely client-side -- there's no server-held catalog
// to validate a hire against the way ITEM_CATALOG backs the Auction House.
// This route still does real, meaningful validation (the unit must really
// exist in the named foreign faction's roster, quantity and price are
// bounds-checked against generous ceilings, and the player's own gold
// balance -- which IS server-authoritative -- caps the worst case of any
// single hire) and, critically, actually PERSISTS the result: hiring a
// merc used to be a purely client-side state mutation that vanished the
// next time game state was re-fetched from anywhere else, which is why
// hired mercs never showed up in the roster or a battle. A tighter fix
// would move listing generation itself server-side; tracked as a
// follow-up, not done here.
const MERC_MAX_QTY        = 20;
const MERC_MAX_COST_PER_UNIT = 50000;

router.post('/merc/hire', async (req, res) => {
  try {
    const { unitId, factionId, quantity, costPerUnit } = req.body;
    const qty  = Math.max(1, Math.min(MERC_MAX_QTY, parseInt(quantity) || 0));
    const cost = Number(costPerUnit);

    if (!unitId || !factionId) return res.status(400).json({ error: 'unitId and factionId required.' });
    if (!(qty > 0)) return res.status(400).json({ error: 'Invalid quantity.' });
    if (!(cost > 0) || !Number.isFinite(cost) || cost > MERC_MAX_COST_PER_UNIT) {
      return res.status(400).json({ error: 'Invalid contract price.' });
    }

    const player = await db.get('SELECT * FROM players WHERE id = ?', [req.session.playerId]);
    if (!player.faction) return res.status(400).json({ error: 'Choose a faction first.' });
    if (factionId === player.faction) {
      return res.status(400).json({ error: 'Mercenaries must come from a foreign faction.' });
    }

    const mercFaction = FACTIONS[factionId];
    const uDef = mercFaction?.units.find(u => u.id === unitId);
    if (!uDef) return res.status(400).json({ error: 'Invalid mercenary unit.' });

    const totalCost = Math.round(cost * qty);
    if (player.gold < totalCost) return res.status(400).json({ error: `Need ${totalCost} gold.` });

    // Stack onto an existing contract for the exact same unit+origin
    // faction rather than creating a duplicate row.
    const existing = await db.get(
      'SELECT quantity FROM army WHERE player_id = ? AND unit_id = ?',
      [req.session.playerId, unitId]
    );
    if (existing) {
      await db.run(
        'UPDATE army SET quantity = quantity + ?, is_merc = TRUE, merc_faction = ? WHERE player_id = ? AND unit_id = ?',
        [qty, factionId, req.session.playerId, unitId]
      );
    } else {
      await db.run(
        'INSERT INTO army (player_id, unit_id, quantity, is_merc, merc_faction) VALUES (?, ?, ?, TRUE, ?)',
        [req.session.playerId, unitId, qty, factionId]
      );
    }

    await db.run('UPDATE players SET gold = gold - ? WHERE id = ?', [totalCost, player.id]);
    await updatePower(req.session.playerId);

    const msg = `Hired ${qty}× ${uDef.name} mercenaries from the ${mercFaction.name}.`;
    await logEvent(req.session.playerId, msg, 'recruit');
    res.json({ ok: true, unit: unitId, unitName: uDef.name, quantity: qty, totalCost, message: msg });
  } catch (err) {
    console.error('Merc hire error:', err);
    res.status(500).json({ error: 'Mercenary hire failed.' });
  }
});

// ── POST /api/game/battle ─────────────────────────────────────────
// Casualty model: a proportional loss rolled once per battle, scaled by
// how close the fight was -- a decisive win/loss rolls toward the bottom
// of its range, a near-even fight rolls toward the top -- and a bad
// defeat costs real units without ever being able to wipe the whole
// committed force in one raid.
//
// "Flawless" (0 losses) is meant to be an emergent, rare-but-possible
// outcome of a dominant win, at ANY army size. The proportional model
// alone can't deliver that on its own: round(committed * rate) hits its
// floor at rate=0.04 (the most dominant win possible), so any committed
// force of 13+ units always rounds up to at least 1 casualty no matter
// how lucky the roll -- Flawless becomes silently impossible past a
// trivially small army instead of just rare. FLAWLESS_CHANCE below is a
// separate, explicit rare-roll on top of that model specifically so a
// big, one-sided victory can still occasionally cost nothing, matching
// what "very rare but possible" actually promises to the player.
const CASUALTY_RANGE = { win: [0.04, 0.12], lose: [0.10, 0.25] };
const FLAWLESS_BASE = 0.03;          // floor chance even in a near-even win
const FLAWLESS_DOMINANCE_BONUS = 0.07; // extra chance the more lopsided the win

function evennessOf(powerRatio) {
  // powerRatio = defender.power / attacker.power -- near 1 is an even
  // fight; far from 1 in either direction is lopsided.
  return Math.max(0, 1 - Math.abs(1 - powerRatio) / 1.5);
}

function rollCasualtyRate(win, powerRatio, casualtyReduction) {
  const [lo, hi] = CASUALTY_RANGE[win ? 'win' : 'lose'];
  const evenness = evennessOf(powerRatio);
  const t = 0.6 * evenness + 0.4 * Math.random();
  const rate = (lo + (hi - lo) * t) * Math.max(0, 1 - casualtyReduction);
  return Math.max(0, rate);
}

function rollFlawless(win, powerRatio) {
  if (!win) return false;
  const dominance = 1 - evennessOf(powerRatio);
  return Math.random() < (FLAWLESS_BASE + FLAWLESS_DOMINANCE_BONUS * dominance);
}

// Applies a selected consumable's effect (server/itemData.js mirrors the
// client's effect fields -- see that file's header) and consumes one
// charge. Never trusts an effect value from the request itself, only the
// server's own catalog, and only once ownership of a real charge is
// confirmed.
async function resolveBattleItem(playerId, itemId) {
  const none = { atkMult: 1, winChanceBonus: 0, casualtyReduction: 0, usedItem: null };
  if (!itemId) return none;
  const catalogItem = ITEM_CATALOG[itemId];
  if (!catalogItem || catalogItem.itemCategory !== 'consumable' || !catalogItem.effect) return none;

  const row = await db.get(
    'SELECT * FROM items WHERE player_id = ? AND item_id = ? AND qty > 0',
    [playerId, itemId]
  );
  if (!row) return none;

  const e = catalogItem.effect;
  if (row.qty <= 1) await db.run('DELETE FROM items WHERE id = ?', [row.id]);
  else              await db.run('UPDATE items SET qty = qty - 1 WHERE id = ?', [row.id]);

  return {
    // unitTypeBonus (cavalry_spurs) is applied as a flat attack boost --
    // there's no per-unit archetype tag server-side yet to restrict it to.
    atkMult: 1 + (e.atkBoost || 0) + (e.unitTypeBonus?.atkBoost || 0),
    winChanceBonus: e.winChanceBoost || 0,
    casualtyReduction: e.casualtyReduction || 0,
    usedItem: { id: itemId, name: catalogItem.name, qty: catalogItem.qty, effect: e },
  };
}

router.post('/battle', async (req, res) => {
  try {
    const { targetId, units, itemId } = req.body;
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

    const { atkMult, winChanceBonus, casualtyReduction, usedItem } = await resolveBattleItem(attacker.id, itemId);

    const effectiveAtkPower = attacker.power * atkMult;
    let winChance = effectiveAtkPower / (effectiveAtkPower + (defender.power || 1) * 0.8);
    winChance = Math.min(0.95, Math.max(0.05, winChance + winChanceBonus));
    const win = Math.random() < winChance;
    const powerRatio = defender.power / (attacker.power || 1);

    // ── Casualties: only the attacker's own committed units are at risk.
    // `units` (unitId -> qty) is the raid modal's selection, which
    // pre-fills the player's whole army by default -- trust it only up
    // to what's actually owned per row, and fall back to the whole army
    // when no selection came through at all (still capped by ownership).
    const armyRows = await db.all('SELECT * FROM army WHERE player_id = ?', [attacker.id]);
    const hasSelection = units && typeof units === 'object' && Object.values(units).some(q => Number(q) > 0);
    // See rollFlawless's comment above: this is what actually makes a
    // Flawless win possible once the committed force is bigger than a
    // handful of units, instead of just the proportional rate's own floor.
    const casualtyRate = rollFlawless(win, powerRatio) ? 0 : rollCasualtyRate(win, powerRatio, casualtyReduction);
    const casualties = {};
    let totalCasualties = 0;
    for (const row of armyRows) {
      const owned = row.quantity || 0;
      if (owned <= 0) continue;
      const committed = hasSelection
        ? Math.max(0, Math.min(owned, Math.floor(Number(units[row.unit_id]) || 0)))
        : owned;
      if (committed <= 0) continue;
      const lost = Math.min(owned, Math.round(committed * casualtyRate));
      if (lost <= 0) continue;
      const lookupFaction = row.is_merc && row.merc_faction ? FACTIONS[row.merc_faction] : FACTIONS[attacker.faction];
      const unitDef = lookupFaction?.units.find(u => u.id === row.unit_id);
      casualties[row.unit_id] = { lost, original: owned, name: unitDef?.name || row.unit_id };
      totalCasualties += lost;
      await db.run(
        `UPDATE army SET quantity = ${db._type === 'postgres' ? 'GREATEST' : 'MAX'}(0, quantity - ?) WHERE player_id = ? AND unit_id = ?`,
        [lost, attacker.id, row.unit_id]
      );
    }

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
      const msg = `Victory over ${defender.name}! Plundered +${goldGain}g, +${manaGain}m, seized ${landGain} acres.`
        + (totalCasualties > 0 ? ` Lost ${totalCasualties} unit${totalCasualties > 1 ? 's' : ''} in the clash.` : '');
      await logEvent(attacker.id, msg, 'battle_win');
      result = { win: true, goldGain, manaGain, landGain, targetName: defender.name, targetFaction: defender.faction, winChance, powerRatio, casualties, totalCasualties, usedItem, message: msg };
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
      const msg = `Defeated by ${defender.name}. Lost ${goldLoss}g and ${manaLoss}m`
        + (totalCasualties > 0 ? `, and ${totalCasualties} unit${totalCasualties > 1 ? 's' : ''} in the retreat.` : '.');
      await logEvent(attacker.id, msg, 'battle_loss');
      result = { win: false, goldLoss, manaLoss, targetName: defender.name, targetFaction: defender.faction, winChance, powerRatio, casualties, totalCasualties, usedItem, message: msg };
    }

    // Recomputes power from the DB, which now reflects any army losses
    // above as well as the land change -- a costly win leaves the
    // attacker measurably weaker for their next fight, not just richer.
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
    // creating a duplicate every purchase (shared with /explore's item
    // finds via grantOrStackItem).
    await grantOrStackItem(player.id, itemId, item.qty);

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
