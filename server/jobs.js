/**
 * server/jobs.js
 * Background cron jobs:
 *   - Every 2 minutes: award +1 turn to all players under cap
 *   - Every 60 seconds: apply passive gold/mana income (1/60th of hourly rate)
 */

const cron = require('node-cron');
const db   = require('./db');
const { FACTIONS, calcEconomy } = require('./gameData');

function startJobs() {
  // ── Turn regeneration: +1 turn every 2 minutes ──────────────────
  cron.schedule('*/2 * * * *', async () => {
    try {
      const maxTurns = parseInt(process.env.TURN_MAX) || 200;
      // Use LEAST() for PostgreSQL (MIN() doesn't work in UPDATE SET in Postgres)
      if (db._type === 'postgres') {
        await db.run(
          `UPDATE players SET turns = LEAST(turns + 1, $1) WHERE turns < $2`,
          [maxTurns, maxTurns]
        );
      } else {
        await db.run(
          `UPDATE players SET turns = MIN(turns + 1, ?) WHERE turns < ?`,
          [maxTurns, maxTurns]
        );
      }
    } catch (err) {
      console.error('[Jobs] Turn regen error:', err.message);
    }
  });

  // ── Economy tick: apply 1/60th of hourly income every minute ────
  cron.schedule('* * * * *', async () => {
    try {
      const players = await db.all('SELECT * FROM players WHERE faction IS NOT NULL');

      for (const player of players) {
        const buildings = await db.all('SELECT * FROM buildings WHERE player_id = ?', [player.id]);
        const army      = await db.all('SELECT * FROM army WHERE player_id = ?', [player.id]);
        const eco       = calcEconomy(player, buildings, army, player.faction);

        // Apply 1 minute of income (1/60 of hourly)
        const goldTick = Math.round(eco.goldNet / 60);
        const manaTick = Math.round(eco.manaNet / 60);

        if (goldTick !== 0 || manaTick !== 0) {
          // GREATEST() on Postgres, MAX() on sql.js — MAX(a,b) is aggregate-only in Postgres
          const clampFn = db._type === 'postgres' ? 'GREATEST' : 'MAX';
          await db.run(
            `UPDATE players SET
              gold = ${clampFn}(0, gold + ?),
              mana = ${clampFn}(0, mana + ?)
             WHERE id = ?`,
            [goldTick, manaTick, player.id]
          );
        }
      }
    } catch (err) {
      console.error('[Jobs] Economy tick error:', err.message);
    }
  });

  // ── Bot growth: gradually raise AI opponent power toward their cap ──
  // Once a day, each bot's power creeps a little closer to the ceiling
  // it was seeded with (see seedBots.js) — mimicking a player slowly
  // building up their empire, without ever overshooting into an
  // unbeatable outlier. Real players (bot_power_cap IS NULL) are
  // untouched by this job.
  cron.schedule('0 6 * * *', async () => {
    try {
      const clampFn = db._type === 'postgres' ? 'LEAST' : 'MIN';
      await db.run(
        `UPDATE players
           SET power = ${clampFn}(power + CAST(bot_power_cap * 0.02 AS INTEGER), bot_power_cap)
         WHERE is_bot = ? AND bot_power_cap IS NOT NULL AND power < bot_power_cap`,
        [true]
      );
    } catch (err) {
      console.error('[Jobs] Bot growth error:', err.message);
    }
  });

  console.log('⏱  Background jobs started (turn regen every 2 min, economy tick every 1 min, bot growth daily)');
}

module.exports = { startJobs };
