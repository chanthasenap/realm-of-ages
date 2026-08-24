/**
 * server/routes/auth.js
 */

const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const router  = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)        return res.status(400).json({ error: 'All fields required.' });
    if (!email.includes('@') || !email.includes('.')) return res.status(400).json({ error: 'Invalid email address.' });
    if (password.length < 8)                return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (name.length < 2 || name.length > 32) return res.status(400).json({ error: 'Name must be 2–32 characters.' });
    // Reject obviously bad characters in name
    if (!/^[\w\s'-]+$/.test(name))           return res.status(400).json({ error: 'Name contains invalid characters.' });

    const existing = await db.get('SELECT id FROM players WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const result = await db.run(
      'INSERT INTO players (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash]
    );

    req.session.playerId   = result.lastID;
    req.session.playerName = name.trim();
    req.session.save();
    res.json({ ok: true, id: result.lastID, name: name.trim() });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const player = await db.get('SELECT * FROM players WHERE email = ?', [email.toLowerCase().trim()]);
    if (!player) {
      // constant-time response to prevent email enumeration
      await bcrypt.compare(password, '$2b$12$invalidhashpadding000000000000000000000000000000000000000');
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, player.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    await db.run('UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [player.id]);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Session error.' });
      req.session.playerId   = player.id;
      req.session.playerName = player.name;
      res.json({
        ok: true,
        id: player.id,
        name: player.name,
        faction: player.faction,
        needsFaction: !player.faction,
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('roa.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me — restore session on page reload
router.get('/me', async (req, res) => {
  if (!req.session.playerId) return res.status(401).json({ error: 'Not logged in.' });
  try {
    const p = await db.get(
      'SELECT id, name, faction, turns, gold, mana, land, victories, defeats, power FROM players WHERE id = ?',
      [req.session.playerId]
    );
    if (!p) {
      req.session.destroy();
      return res.status(401).json({ error: 'Session invalid.' });
    }
    res.json({ ok: true, player: p, needsFaction: !p.faction });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
