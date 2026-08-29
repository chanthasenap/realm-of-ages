/**
 * server/jobs.js
 * Background cron jobs:
 *   - Every 2 minutes: award +1 turn to all players under cap
 *   - Every 60 seconds: apply passive gold/mana income (1/60th of hourly rate)
 */

const cron = require('node-cron');
const db   = require('./db');
const { FACTIONS, calcEconomy } = require('./gameData');
const { HERO_HP_REGEN_PCT, HERO_DOWNED_RECOVER_PCT } = require('./heroData');

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

  // ── Hero HP regen: +8% max HP every 2 minutes, piggybacked on the same
  // schedule as turn regen (design doc §5) -- full heal from 0 in ~26 min.
  // A `downed` hero flips back to `active` once healed past the recovery
  // threshold; `slain` heroes don't regen at all (they need a paid
  // resurrection). Looping in JS (rather than one aggregate UPDATE) keeps
  // this portable across sql.js/Postgres without relying on dialect-
  // specific CEIL/LEAST behavior for a table that's only ever one row per
  // active player.
  cron.schedule('*/2 * * * *', async () => {
    try {
      const heroes = await db.all(`SELECT * FROM heroes WHERE status IN ('active', 'downed')`);
      for (const h of heroes) {
        const newHp = Math.min(h.max_hp, h.hp + Math.ceil(h.max_hp * HERO_HP_REGEN_PCT));
        const recovered = h.status === 'downed' && newHp >= Math.ceil(h.max_hp * HERO_DOWNED_RECOVER_PCT);
        if (newHp === h.hp && !recovered) continue;
        if (recovered) {
          await db.run('UPDATE heroes SET hp = ?, status = ?, status_since = ? WHERE player_id = ?', [newHp, 'active', Date.now(), h.player_id]);
        } else {
          await db.run('UPDATE heroes SET hp = ? WHERE player_id = ?', [newHp, h.player_id]);
        }
      }
    } catch (err) {
      console.error('[Jobs] Hero regen error:', err.message);
    }
  });

  // ── Economy tick: apply 1/60th of hourly income every minute ────
  cron.schedule('* * * * *', async () => {
    try {
      const players = await db.all('SELECT * FROM players WHERE faction IS NOT NULL');

      for (const player of players) {
        const buildings = await db.all('SELECT * FROM buildings WHERE player_id = ?', [player.id]);
        const army      = await db.all('SELECT * FROM army WHERE player_id = ?', [player.id]);
        const hero      = await db.get('SELECT * FROM heroes WHERE player_id = ?', [player.id]);
        const eco       = calcEconomy(player, buildings, army, player.faction, hero);

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

  console.log('⏱  Background jobs started (turn regen + hero HP regen every 2 min, economy tick every 1 min, bot growth daily)');
}

module.exports = { startJobs };
