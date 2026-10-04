const path = require('path');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const config = require('./config');
const db = require('./db');
const helpers = require('./lib/helpers');
const { icon } = require('./lib/icons');
const SqliteSessionStore = require('./lib/session-store');
const { ensureUploadDirs } = require('./lib/files');
const flash = require('./middleware/flash');
const csrf = require('./middleware/csrf');
const { loadUser } = require('./middleware/auth');

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

function createApp() {
  ensureUploadDirs();

  const app = express();
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  Object.assign(app.locals, helpers, {
    icon,
    siteName: config.siteName,
    allowSignup: config.allowSignup,
    maxVideoMb: config.maxVideoMb,
    year: new Date().getFullYear(),
  });

  // Per-request nonce for the one inline script (theme bootstrap).
  app.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'"],
          frameSrc: ['https://www.youtube-nocookie.com', 'https://www.youtube.com'],
          connectSrc: ["'self'"],
          // Allow plain-http hosting (e.g. a LAN IP) without breaking assets.
          upgradeInsecureRequests: null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Static assets are served before sessions so they never touch the store.
  const staticOptions = { maxAge: config.isProduction ? '7d' : 0 };
  app.use(express.static(path.join(config.root, 'public'), staticOptions));
  // Only the public upload folders are exposed; lesson videos and resources
  // go through access-checked routes.
  app.use('/uploads/images', express.static(path.join(config.uploadDir, 'images'), staticOptions));
  app.use('/uploads/media', express.static(path.join(config.uploadDir, 'media'), staticOptions));

  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(express.json({ limit: '2mb' }));

  app.use(
    session({
      name: 'codenest.sid',
      store: new SqliteSessionStore(db, { ttl: SESSION_TTL }),
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: SESSION_TTL },
    }),
  );
  app.use(flash);
  app.use(loadUser);
  app.use(csrf);
  // Upload forms posted with XHR (to show a progress bar) get the redirect
  // target as JSON, so the browser navigates there itself.
  app.use((req, res, next) => {
    if (req.get('X-Upload-Request') === '1') {
      res.redirect = (status, url) => res.json({ redirect: typeof status === 'string' ? status : url });
    }
    next();
  });
  app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.searchQuery = typeof req.query.q === 'string' ? req.query.q : '';
    next();
  });

  app.use(require('./routes/auth'));
  app.use(require('./routes/public'));
  app.use(require('./routes/user'));
  app.use('/admin', require('./routes/admin'));

  app.use((req, res) => {
    res.status(404).render('errors/error', {
      title: 'Page not found',
      status: 404,
      message: "We couldn't find the page you were looking for. It may have been moved or unpublished.",
    });
  });

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    if (res.headersSent) return next(err);
    res.status(status).render('errors/error', {
      title: status >= 500 ? 'Something went wrong' : 'Request error',
      status,
      message: status >= 500 ? 'An unexpected error occurred. Please try again in a moment.' : err.message,
    });
  });

  return app;
}

module.exports = createApp;
