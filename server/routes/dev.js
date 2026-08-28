/**
 * server/routes/dev.js
 *
 * Developer-only testing utility. Restricted, server-side, to a single
 * hardcoded account — the game's creator's own test email. It can NEVER
 * affect any other player's account, no matter who is logged in or what
 * gets sent in the request body.
 *
 * To fully retire this before a real launch: delete this file, remove the
 * two lines in server/index.js that require/mount it, and remove the
 * button in public/index.html + its wiring in public/js/game.js.
 * Until then, set DEV_TOOLS_ENABLED=false in your environment to disable
 * it without a code change.
 */

const express = require('express');
const db = require('../db');
const router = express.Router();

const DEV_EMAIL = (process.env.DEV_RESET_EMAIL || 'chanthasena.peter@gmail.com').toLowerCase().trim();
const enabled = () => process.env.DEV_TOOLS_ENABLED !== 'false';

// POST /api/dev/reset-account
// Caller must already be logged in AS the dev account. Permanently deletes
// that player row (buildings, army, items, and battle/event log rows cascade
// automatically via the foreign keys in server/init-db.js) and destroys the
// session. Afterwards the same email is free to go through /api/auth/register
// again from scratch — this is what lets the creator repeatedly test
// registration + login + faction select without burning a new email address.
router.post('/reset-account', async (req, res) => {
  if (!enabled()) return res.status(404).json({ error: 'Not found.' });

  if (!req.session.playerId) {
    return res.status(401).json({ error: 'You must be logged in to reset your account.' });
  }

  try {
    const player = await db.get('SELECT id, email FROM players WHERE id = ?', [req.session.playerId]);

    if (!player || player.email.toLowerCase().trim() !== DEV_EMAIL) {
      return res.status(403).json({ error: 'This tool is restricted to the developer test account.' });
    }

    await db.run('DELETE FROM players WHERE id = ?', [player.id]);

    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: 'Account deleted, but session cleanup failed. Clear your cookies and try registering again.' });
      res.clearCookie('roa.sid');
      res.json({ ok: true, deleted: true });
    });
  } catch (err) {
    console.error('Dev reset error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/dev/refill-turns
// Same restriction as reset-account: only the developer test account, only
// while logged in as it. Sets turns back to the schema's starting value
// server-side -- the button previously only nudged the client's local
// Zustand copy of turns, which looked like a refill but never touched the
// player row in the DB, so the very next turn-costing action (explore,
// build, recruit, battle) would immediately fail with "not enough turns"
// against the real, un-refilled balance.
router.post('/refill-turns', async (req, res) => {
  if (!enabled()) return res.status(404).json({ error: 'Not found.' });

  if (!req.session.playerId) {
    return res.status(401).json({ error: 'You must be logged in to use this tool.' });
  }

  try {
    const player = await db.get('SELECT id, email FROM players WHERE id = ?', [req.session.playerId]);

    if (!player || player.email.toLowerCase().trim() !== DEV_EMAIL) {
      return res.status(403).json({ error: 'This tool is restricted to the developer test account.' });
    }

    await db.run('UPDATE players SET turns = 200 WHERE id = ?', [player.id]);
    res.json({ ok: true, turns: 200 });
  } catch (err) {
    console.error('Dev refill-turns error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
