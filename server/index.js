/**
 * server/index.js
 * Main Express server for Realm of Ages.
 */

require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const path        = require('path');
const rateLimit   = require('express-rate-limit');

const authRoutes  = require('./routes/auth');
const gameRoutes  = require('./routes/game');
const { startJobs } = require('./jobs');
const { runMigrations } = require('./migrate');
const { seedBots } = require('./seedBots');

const app    = express();
const PORT   = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// ── Security headers ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
// CSP disabled: frontend uses inline onclick handlers and CDN-loaded Tabler icons

// Trust Render's load balancer (fixes X-Forwarded-For rate limiting warning)
if (isProd) app.set('trust proxy', 1);

app.use(cors({ origin: isProd ? false : true, credentials: true }));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiting ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },  // Render sets this header; suppress warning
});

const gameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },  // Render sets this header; suppress warning
});

app.use('/api/auth', authLimiter);
app.use('/api/game', gameLimiter);

// ── Session store ─────────────────────────────────────────────────
// Production: PostgreSQL-backed (survives restarts, scales)
// Development: In-memory (simple, no native deps needed)
let sessionStore;

if (isProd && process.env.DATABASE_URL) {
  const pgSession = require('connect-pg-simple')(session);
  sessionStore = new pgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    ssl: { rejectUnauthorized: false },
  });
  console.log('🔒 Session store: PostgreSQL (connect-pg-simple)');
} else {
  // Default MemoryStore — fine for dev, not for production
  // Sessions last as long as the process; restarting the server logs everyone out
  sessionStore = undefined;
  if (!isProd) console.log('🔒 Session store: MemoryStore (dev only — OK to restart freely)');
}

const sessionSecret = process.env.SESSION_SECRET;
if (isProd && !sessionSecret) {
  console.error('FATAL: SESSION_SECRET env var is required in production. Exiting.');
  process.exit(1);
}

app.use(session({
  store: sessionStore,
  secret: sessionSecret || 'dev-secret-not-for-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProd ? 'strict' : 'lax',
  },
  name: 'roa.sid',
}));

// ── API routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

const { FACTIONS, AUCTION_ITEMS } = require('./gameData');
app.get('/api/gamedata', (req, res) => res.json({ FACTIONS, AUCTION_ITEMS }));
app.get('/api/health',   (req, res) => res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV }));

// ── Static frontend ───────────────────────────────────────────────
// Serve JS/CSS with no-cache so deploys are always fresh
app.use('/js', express.static(path.join(__dirname, '..', 'public', 'js'), { maxAge: 0, etag: false, lastModified: false, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store'); } }));
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css'), { maxAge: 0, etag: false, lastModified: false, setHeaders: (res) => { res.setHeader('Cache-Control', 'no-store'); } }));
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '7d' }));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found.' });
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────
runMigrations()
  .then(() => seedBots())
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`\n🏰  Realm of Ages → http://localhost:${PORT}`);
      console.log(`    Mode: ${isProd ? 'PRODUCTION' : 'development'}\n`);
      startJobs();
    });
  });

module.exports = app;
