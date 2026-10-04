const crypto = require('crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function tokensMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

// Synchronizer-token CSRF protection. Forms send the token as `_csrf` in the
// body; multipart forms put it in the action URL's query string (so it is
// checked before any file is written); fetch() calls use the X-CSRF-Token
// header.
function csrf(req, res, next) {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.locals.csrfToken = req.session.csrfToken;
  if (SAFE_METHODS.has(req.method)) return next();

  const sent = (req.body && req.body._csrf) || req.query._csrf || req.get('x-csrf-token');
  if (tokensMatch(sent, req.session.csrfToken)) return next();

  res.status(403);
  if (req.accepts(['html', 'json']) === 'json') return res.json({ error: 'Invalid CSRF token' });
  return res.render('errors/error', {
    title: 'Form expired',
    status: 403,
    message: 'This form has expired or was submitted from another site. Go back, refresh the page and try again.',
  });
}

module.exports = csrf;
