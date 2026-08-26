/**
 * server/seedBots.js
 * Populates a baseline of AI-controlled "bot" accounts so a young game
 * always has believable opponents to raid, even before real signups
 * build up a full playerbase. Bots are ordinary rows in the players
 * table — same schema, same battle/rankings code path as a real
 * account — flagged internally via is_bot only so the growth job (see
 * jobs.js) knows which rows it's allowed to nudge upward over time.
 * That flag is never selected by /game/rankings or /game/targets, so
 * bots are indistinguishable from real players in the client by design.
 *
 * Idempotent: safe to run on every boot. Tops up to TARGET_BOT_COUNT if
 * the current bot count is short; does nothing once the target is met.
 */

const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const db      = require('./db');
const { FACTIONS } = require('./gameData');

const TARGET_BOT_COUNT = 250;

const FIRST_NAMES = ['Aeron','Aldric','Azura','Bastian','Caelum','Daenar','Elowen','Faeron','Galeth','Hadric','Ivar','Jareth','Kael','Laric','Malveth','Narek','Orin','Petra','Riven','Seraph','Thorn','Vael','Wren','Zira','Corwin','Isolde','Maren','Torin'];
const LAST_NAMES  = ['Ironblood','Moonweave','Deepcurrent','Starwatcher','Ashveil','Brightmantle','Coldforge','Emberfist','Frostmark','Galeborn','Ironveil','Jadewing','Kindlecrest','Nightfall','Pyrebrand','Shadowmend','Tidecaller','Duskrunner','Stormhollow','Wyrmshield'];
const FACTION_IDS = Object.keys(FACTIONS);

function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// Same 60/30/10 low/mid/high split already used for the client's rankings
// filler — most bots are easy, believable early targets; a handful are
// genuine end-game threats for veteran players to worry about.
function rollPower(r) {
  const tier = r();
  if (tier < 0.6) return Math.floor(100 + r() * 2900);
  if (tier < 0.9) return Math.floor(3000 + r() * 12000);
  return Math.floor(15000 + r() * 35000);
}

async function seedBots() {
  try {
    const row = await db.get('SELECT COUNT(*) AS count FROM players WHERE is_bot = ?', [true]);
    const existing = parseInt(row?.count) || 0;
    const needed = TARGET_BOT_COUNT - existing;
    if (needed <= 0) {
      console.log(`🤖 Bot roster already at target (${existing}/${TARGET_BOT_COUNT}).`);
      return;
    }

    // Bots never log in with this password — one shared, unguessable hash
    // is fine and avoids paying bcrypt's cost 250 separate times at boot.
    const placeholderHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);

    const r = rng(Date.now() & 0xffffffff);
    const usedNames = new Set();
    const now = Date.now();

    for (let i = 0; i < needed; i++) {
      let name;
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = `${FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(r() * LAST_NAMES.length)]}`;
        if (!usedNames.has(candidate)) { name = candidate; usedNames.add(candidate); break; }
        name = candidate; // exhausted retries — allow the duplicate, real players can share names too
      }

      const power     = rollPower(r);
      const gold       = Math.max(50, Math.round(power * 0.3  * (0.8 + r() * 0.4)));
      const mana       = Math.max(10, Math.round(power * 0.12 * (0.8 + r() * 0.4)));
      const land       = Math.max(5,  Math.round(power / 18));
      const victories  = Math.round((power / 600) * (0.5 + r()));
      const defeats    = Math.round((power / 900) * (0.5 + r()));
      const powerCap   = Math.round(power * (1.4 + r() * 0.6));
      const faction    = FACTION_IDS[Math.floor(r() * FACTION_IDS.length)];
      const email      = `bot_${crypto.randomBytes(6).toString('hex')}@raid.realm-of-ages.internal`;
      const createdAt  = new Date(now - Math.floor(r() * 60) * 86400000).toISOString();
      const lastLogin  = new Date(now - Math.floor(r() * 5)  * 86400000).toISOString();

      await db.run(
        `INSERT INTO players
           (email, name, password, faction, turns, gold, mana, land, victories, defeats,
            power, is_bot, bot_power_cap, created_at, last_login)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, name, placeholderHash, faction, 200, gold, mana, land, victories, defeats,
         power, true, powerCap, createdAt, lastLogin]
      );
    }

    console.log(`🤖 Seeded ${needed} bot commanders (${existing + needed}/${TARGET_BOT_COUNT}).`);
  } catch (err) {
    console.error('⚠️  Bot seeding failed:', err.message);
  }
}

module.exports = { seedBots };
