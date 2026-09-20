const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const session   = require('express-session');
const passport = require('./config/passport'); // initialises strategy

const authRoutes    = require('./routes/auth');
const eventRoutes   = require('./routes/events');
const photoRoutes   = require('./routes/photos');
const galleryRoutes = require('./routes/galleries');

const app = express();

// Trust Render/Vercel reverse proxy (needed for rate limiting & secure cookies)
app.set('trust proxy', 1);

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── Rate limiters ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many PIN attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173']
).map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / curl with no origin
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Session (needed only for the OAuth redirect handshake) ──────────────────
const isProd = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET && isProd) {
  throw new Error('SESSION_SECRET environment variable is required in production');
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,           // HTTPS only in production
    httpOnly: true,           // not accessible via JS
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 10 * 60 * 1000,  // 10 min — just enough for OAuth flow
  },
}));

// ─── Passport ─────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use(['/api/auth/login', '/auth/login'], authLimiter);
app.use(['/api/auth/register', '/auth/register'], authLimiter);
app.use('/api/galleries/public', pinLimiter);
app.use(['/api/auth', '/auth'], authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/galleries', galleryRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Maximum size is 20 MB' });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(415).json({ message: err.message });
  }

  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
