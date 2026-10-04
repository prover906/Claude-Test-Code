const users = require('../models/users');

// Loads the signed-in user on every request. Banned or deleted accounts are
// signed out immediately.
function loadUser(req, res, next) {
  req.user = null;
  if (req.session && req.session.userId) {
    const user = users.findById(req.session.userId);
    if (user && user.status === 'active') req.user = user;
    else delete req.session.userId;
  }
  res.locals.currentUser = req.user;
  res.locals.isAdmin = Boolean(req.user && req.user.role === 'admin');
  next();
}

function redirectToLogin(req, res) {
  req.flash('info', 'Please sign in to continue.');
  const next = req.method === 'GET' ? req.originalUrl : refererPath(req);
  return res.redirect(`/login?next=${encodeURIComponent(safeRedirect(next))}`);
}

function requireAuth(req, res, next) {
  if (!req.user) return redirectToLogin(req, res);
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return redirectToLogin(req, res);
  if (req.user.role !== 'admin') {
    return res.status(403).render('errors/error', {
      title: 'Access denied',
      status: 403,
      message: 'This area is only available to administrators.',
    });
  }
  next();
}

function requireGuest(req, res, next) {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/dashboard');
  next();
}

// Only allow redirects to local paths, never to other sites.
function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string') return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) return fallback;
  return target;
}

// The path part of a Referer header, if it points at this site.
function refererPath(req) {
  const referer = req.get('Referrer');
  if (!referer) return '/';
  try {
    const url = new URL(referer);
    return url.host === req.get('host') ? url.pathname + url.search : '/';
  } catch {
    return '/';
  }
}

module.exports = { loadUser, requireAuth, requireAdmin, requireGuest, safeRedirect };
