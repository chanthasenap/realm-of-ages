/**
 * server/migrate.js
 * Small, idempotent schema patch for databases created before a given
 * column/default existed. Safe to run on every boot — every statement is
 * either a no-op if already applied, or uses IF NOT EXISTS/IF EXISTS guards.
 * (init-db.js's CREATE TABLE IF NOT EXISTS only helps brand-new databases;
 * this file is what brings an already-running production DB up to date.)
 */

const db = require('./db');

async function runMigrations() {
  if (db._type !== 'postgres') return; // sql.js (dev) always starts from the current schema

  const statements = [
    `ALTER TABLE players ALTER COLUMN turns SET DEFAULT 200`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_chains INTEGER DEFAULT 0`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_shield BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_last_date TEXT`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_reward_claimed BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_just_broke BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS streak_just_shielded BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS is_bot BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE players ADD COLUMN IF NOT EXISTS bot_power_cap INTEGER`,
    // The auction purchase route used to validate against a completely
    // different (long-stale) item list than what the client actually
    // offered, so every purchase failed with "Item not found" -- these
    // columns let a row point at the real catalog entry (server/itemData.js)
    // instead of only carrying denormalized display strings.
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS item_id TEXT`,
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1`,
    // Mercenary hires (Merc Hall) used to be a purely client-side mock --
    // never sent to the server at all -- so a hired merc looked like it
    // joined your army for a moment and then silently vanished the next
    // time game state was re-fetched from anywhere else. These columns
    // let a real, persisted army row be flagged as a mercenary and record
    // which (foreign) faction its unit definition and stats come from.
    `ALTER TABLE army ADD COLUMN IF NOT EXISTS is_merc BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE army ADD COLUMN IF NOT EXISTS merc_faction TEXT`,
  ];

  for (const stmt of statements) {
    try {
      await db.exec(stmt);
    } catch (err) {
      console.error(`⚠️  Migration step failed (${stmt}):`, err.message);
    }
  }
  console.log('🛠  DB migrations checked/applied.');
}

module.exports = { runMigrations };
