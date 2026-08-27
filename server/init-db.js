/**
 * scripts/init-db.js
 * Run once to create all tables: `npm run db:init`
 * Works for both SQLite (local) and PostgreSQL (production).
 */

require('dotenv').config();
const db = require('../server/db');

const schema = `
  CREATE TABLE IF NOT EXISTS players (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    UNIQUE NOT NULL,
    name         TEXT    NOT NULL,
    password     TEXT    NOT NULL,
    faction      TEXT,
    turns        INTEGER DEFAULT 200,
    gold         INTEGER DEFAULT 250,
    mana         INTEGER DEFAULT 50,
    land         INTEGER DEFAULT 0,
    victories    INTEGER DEFAULT 0,
    defeats      INTEGER DEFAULT 0,
    power        INTEGER DEFAULT 0,
    streak_days           INTEGER DEFAULT 0,
    streak_chains         INTEGER DEFAULT 0,
    streak_shield         BOOLEAN DEFAULT FALSE,
    streak_last_date      TEXT,
    streak_reward_claimed BOOLEAN DEFAULT FALSE,
    streak_just_broke     BOOLEAN DEFAULT FALSE,
    streak_just_shielded  BOOLEAN DEFAULT FALSE,
    is_bot       BOOLEAN DEFAULT FALSE,
    bot_power_cap INTEGER,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS buildings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    building_id  TEXT    NOT NULL,
    level        INTEGER DEFAULT 1,
    built_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, building_id)
  );

  CREATE TABLE IF NOT EXISTS army (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    unit_id      TEXT    NOT NULL,
    quantity     INTEGER DEFAULT 0,
    UNIQUE(player_id, unit_id)
  );

  CREATE TABLE IF NOT EXISTS items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    item_id      TEXT,
    item_name    TEXT    NOT NULL,
    item_icon    TEXT,
    item_rarity  TEXT    DEFAULT 'common',
    qty          INTEGER DEFAULT 1,
    acquired_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS battle_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    attacker_id  INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    defender_id  INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    result       TEXT    NOT NULL,
    gold_change  INTEGER DEFAULT 0,
    mana_change  INTEGER DEFAULT 0,
    land_change  INTEGER DEFAULT 0,
    occurred_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_log (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id    INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    message      TEXT    NOT NULL,
    category     TEXT    DEFAULT 'info',
    occurred_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// PostgreSQL uses SERIAL instead of INTEGER AUTOINCREMENT
const pgSchema = schema
  .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
  .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMPTZ DEFAULT NOW()');

async function init() {
  try {
    const isPostgres = !!process.env.DATABASE_URL;
    const sql = isPostgres ? pgSchema : schema;

    // Split on ; and run each statement (needed for pg which won't run multi-statement)
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await db.exec(stmt + ';');
    }

    console.log('✅ Database initialized successfully.');
    console.log(`   Tables: players, buildings, army, items, battle_log, event_log`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  }
}

init();
