/**
 * server/db.js
 * Auto-selects SQLite (local dev) or PostgreSQL (production).
 * Same db.get() / db.all() / db.run() / db.exec() API either way.
 *
 * Production (DATABASE_URL set): PostgreSQL via pg pool
 * Development (no DATABASE_URL):  sql.js (pure-JS WASM SQLite, zero native deps)
 *
 * Note: sql.js stores data in memory by default and saves to a file on changes.
 * For production use, always set DATABASE_URL to a real PostgreSQL instance.
 */

require('dotenv').config();
const path = require('path');
const fs   = require('fs');

let db;

if (process.env.DATABASE_URL) {
  // ── PostgreSQL (production) ──────────────────────────────────────────────
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const toPostgres = (sql) => {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  };

  db = {
    get:  (sql, params = []) => pool.query(toPostgres(sql), params).then(r => r.rows[0]),
    all:  (sql, params = []) => pool.query(toPostgres(sql), params).then(r => r.rows),
    run:  (sql, params = []) => pool.query(toPostgres(sql), params).then(r => ({
      lastID: r.rows[0]?.id ?? null,
      changes: r.rowCount,
    })),
    exec: (sql) => pool.query(sql),
    _pool: pool,
    _type: 'postgres',
  };
  console.log('📦 Database: PostgreSQL');

} else {
  // ── sql.js — pure-JS SQLite (local development, no native compilation) ──
  const initSqlJs = require('sql.js');
  const dbPath    = path.join(__dirname, '..', 'realm.db.json');

  // Synchronous wrapper — sql.js itself is sync once initialised
  let sqlDb;
  let dbReady = false;
  const queue = [];

  function runQueued() {
    while (queue.length && dbReady) {
      const { fn, resolve, reject } = queue.shift();
      try { resolve(fn()); } catch (e) { reject(e); }
    }
  }

  function withDb(fn) {
    if (dbReady) {
      try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); }
    }
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
    });
  }

  // Auto-save DB to JSON after every write (simple persistence for dev)
  function save() {
    if (!sqlDb) return;
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data).toString('base64'));
  }

  // Initialise sql.js async, then drain queue
  initSqlJs().then(SQL => {
    let data;
    if (fs.existsSync(dbPath)) {
      try {
        const base64 = fs.readFileSync(dbPath, 'utf8');
        data = Buffer.from(base64, 'base64');
      } catch { data = null; }
    }
    sqlDb = data ? new SQL.Database(data) : new SQL.Database();
    sqlDb.run('PRAGMA foreign_keys = ON;');
    dbReady = true;
    console.log(`📦 Database: SQLite (sql.js) → ${dbPath}`);
    runQueued();
  });

  // Convert sql.js row format [{columns, values}] to array of objects
  function rowsToObjects(results) {
    if (!results || results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }

  // For INSERT: get last rowid
  function lastInsertRowid() {
    const r = sqlDb.exec('SELECT last_insert_rowid() as id');
    return r[0]?.values[0]?.[0] ?? null;
  }

  db = {
    get: (sql, params = []) => withDb(() => {
      const rows = rowsToObjects(sqlDb.exec(sql, params));
      return rows[0] ?? undefined;
    }),
    all: (sql, params = []) => withDb(() => {
      return rowsToObjects(sqlDb.exec(sql, params));
    }),
    run: (sql, params = []) => withDb(() => {
      sqlDb.run(sql, params);
      const lastID = sql.trim().toUpperCase().startsWith('INSERT') ? lastInsertRowid() : null;
      const changes = sqlDb.getRowsModified();
      save();
      return { lastID, changes };
    }),
    exec: (sql) => withDb(() => {
      // exec can contain multiple statements; split on ; and run each
      const stmts = sql.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of stmts) {
        if (stmt) sqlDb.run(stmt);
      }
      save();
      return {};
    }),
    _type: 'sqljs',
  };
}

module.exports = db;
