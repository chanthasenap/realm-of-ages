/**
 * scripts/check-db.js
 * Quick sanity check: `npm run db:check`
 * Verifies all tables exist and prints player count.
 */

require('dotenv').config();
const db = require('../server/db');

async function check() {
  try {
    const tables = ['players', 'buildings', 'army', 'items', 'battle_log', 'event_log'];

    if (process.env.DATABASE_URL) {
      // PostgreSQL
      for (const t of tables) {
        const r = await db.get(`SELECT COUNT(*) as n FROM ${t}`);
        console.log(`  ✓ ${t}: ${r.n} rows`);
      }
    } else {
      // SQLite
      for (const t of tables) {
        const r = await db.get(`SELECT COUNT(*) as n FROM ${t}`);
        console.log(`  ✓ ${t}: ${r.n} rows`);
      }
    }
    console.log('\n✅ Database check passed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
    console.error('   Run: npm run db:init');
    process.exit(1);
  }
}

check();
