const express = require('express');
const { rateLimit } = require('express-rate-limit');
const config = require('../config');
const users = require('../models/users');
const { requireGuest, safeRedirect } = require('../middleware/auth');
const { text, isEmail, passwordProblem } = require('../lib/validate');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler(req, res) {
    res.status(429).render('errors/error', {
      title: 'Too many attempts',
      status: 429,
      message: 'Too many sign-in attempts from your network. Please wait 15 minutes and try again.',
    });
  },
});

// Starts a fresh session for the user (prevents session fixation).
function logIn(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

function landingPage(user) {
  return user.role === 'admin' ? '/admin' : '/dashboard';
}

function renderLogin(res, { values = {}, error = null, next = '', status = 200 } = {}) {
  res.status(status).render('pages/auth/login', {
    title: 'Sign in',
    values,
    error,
    next,
    // The demo student only exists when demo content was seeded.
    demo: config.showDemoCredentials
      ? { admin: config.demo.admin, student: config.seedDemoData ? config.demo.student : null }
      : null,
  });
}

router.get('/login', requireGuest, (req, res) => {
  renderLogin(res, { next: safeRedirect(req.query.next, '') });
});

router.post('/login', requireGuest, authLimiter, async (req, res) => {
  const email = text(req.body.email, { max: 254 }).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const next = safeRedirect(req.body.next, '');

  if (!email || !password) {
    return renderLogin(res, { values: { email }, error: 'Enter your email and password.', next, status: 422 });
  }

  const user = await users.verifyPassword(email, password);
  if (!user) {
    return renderLogin(res, { values: { email }, error: 'Incorrect email or password.', next, status: 401 });
  }
  if (user.status !== 'active') {
    return renderLogin(res, {
      values: { email },
      error: 'This account has been suspended. Please contact the site administrator.',
      next,
      status: 403,
    });
  }

  await logIn(req, user);
  users.touchLogin(user.id);
  req.flash('success', `Welcome back, ${user.name.split(' ')[0]}!`);
  res.redirect(next || landingPage(user));
});

function renderSignup(res, { values = {}, errors = {}, next = '', status = 200 } = {}) {
  res.status(status).render('pages/auth/signup', { title: 'Create your account', values, errors, next });
}

function signupEnabled(req, res, next) {
  if (config.allowSignup) return next();
  req.flash('info', 'New registrations are currently closed.');
  res.redirect('/login');
}

router.get('/signup', requireGuest, signupEnabled, (req, res) => {
  renderSignup(res, { next: safeRedirect(req.query.next, '') });
});

router.post('/signup', requireGuest, signupEnabled, authLimiter, async (req, res) => {
  const values = {
    name: text(req.body.name, { max: 80 }),
    email: text(req.body.email, { max: 254 }).toLowerCase(),
  };
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirm = typeof req.body.confirm === 'string' ? req.body.confirm : '';
  const next = safeRedirect(req.body.next, '');
  const errors = {};

  if (values.name.length < 2) errors.name = 'Please enter your name.';
  if (!isEmail(values.email)) errors.email = 'Please enter a valid email address.';
  else if (users.emailTaken(values.email)) errors.email = 'An account with this email already exists. Try signing in.';
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  else if (password !== confirm) errors.confirm = 'Passwords do not match.';

  if (Object.keys(errors).length) return renderSignup(res, { values, errors, next, status: 422 });

  const user = await users.create({ ...values, password });
  await logIn(req, user);
  users.touchLogin(user.id);
  req.flash('success', `Welcome to ${config.siteName}, ${user.name.split(' ')[0]}! Pick a course to get started.`);
  res.redirect(next || '/courses');
});

router.post('/logout', (req, res, next) => {
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.flash('info', 'You have been signed out.');
    res.redirect('/');
  });
});

module.exports = router;
