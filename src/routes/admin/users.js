const express = require('express');
const users = require('../../models/users');
const courses = require('../../models/courses');
const { removeUpload } = require('../../lib/files');
const { text, isEmail, passwordProblem, id: parseId } = require('../../lib/validate');
const { notFound } = require('./helpers');

const router = express.Router();

function loadUser(req) {
  const id = parseId(req.params.id);
  return id ? users.findById(id) : null;
}

router.get('/', (req, res) => {
  const filters = {
    q: text(req.query.q, { max: 100 }),
    role: users.ROLES.includes(req.query.role) ? req.query.role : '',
    status: users.STATUSES.includes(req.query.status) ? req.query.status : '',
  };
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const result = users.list({ ...filters, page, perPage: 15 });
  res.render('admin/users/index', { title: 'Users', ...result, filters });
});

function renderNewUser(res, { values, errors = {}, status = 200 }) {
  res.status(status).render('admin/users/new', { title: 'Add user', values, errors, roles: users.ROLES });
}

router.get('/new', (req, res) => {
  renderNewUser(res, { values: { name: '', email: '', role: 'student' } });
});

router.post('/', async (req, res) => {
  const values = {
    name: text(req.body.name, { max: 80 }),
    email: text(req.body.email, { max: 254 }).toLowerCase(),
    role: users.ROLES.includes(req.body.role) ? req.body.role : 'student',
  };
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const errors = {};
  if (values.name.length < 2) errors.name = 'Enter the person’s name.';
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.';
  else if (users.emailTaken(values.email)) errors.email = 'A user with this email already exists.';
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  if (Object.keys(errors).length) return renderNewUser(res, { values, errors, status: 422 });

  const user = await users.create({ ...values, password });
  req.flash('success', `Created ${user.role} account for ${user.name}.`);
  res.redirect(`/admin/users/${user.id}`);
});

function renderUser(req, res, { user, values, errors = {}, passwordErrors = {}, status = 200 }) {
  res.status(status).render('admin/users/show', {
    title: user.name,
    user,
    values: values || user,
    errors,
    passwordErrors,
    roles: users.ROLES,
    statuses: users.STATUSES,
    isSelf: user.id === req.user.id,
    enrollments: courses.enrollmentsForUser(user.id),
  });
}

router.get('/:id', (req, res) => {
  const user = loadUser(req);
  if (!user) return notFound(res, 'user');
  renderUser(req, res, { user });
});

router.post('/:id', (req, res) => {
  const user = loadUser(req);
  if (!user) return notFound(res, 'user');
  const isSelf = user.id === req.user.id;
  const values = {
    name: text(req.body.name, { max: 80 }),
    email: text(req.body.email, { max: 254 }).toLowerCase(),
    role: users.ROLES.includes(req.body.role) ? req.body.role : user.role,
    status: users.STATUSES.includes(req.body.status) ? req.body.status : user.status,
    bio: text(req.body.bio, { max: 500 }),
  };
  const errors = {};
  if (values.name.length < 2) errors.name = 'Enter the person’s name.';
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.';
  else if (users.emailTaken(values.email, user.id)) errors.email = 'Another user already has this email.';

  if (isSelf && values.role !== 'admin') errors.role = 'You can’t remove your own admin access.';
  if (isSelf && values.status !== 'active') errors.status = 'You can’t suspend your own account.';
  const losesAdmin = user.role === 'admin' && user.status === 'active' && (values.role !== 'admin' || values.status !== 'active');
  if (losesAdmin && !errors.role && !errors.status && users.activeAdminCount() <= 1) {
    errors.role = 'This is the last active admin. Promote someone else first.';
  }
  if (Object.keys(errors).length) return renderUser(req, res, { user, values, errors, status: 422 });

  users.updateByAdmin(user.id, values);
  if (values.status === 'banned' && user.status !== 'banned') users.endSessions(user.id);
  req.flash('success', `Saved changes to ${values.name}.`);
  res.redirect(`/admin/users/${user.id}`);
});

router.post('/:id/password', async (req, res) => {
  const user = loadUser(req);
  if (!user) return notFound(res, 'user');
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const problem = passwordProblem(password);
  if (problem) return renderUser(req, res, { user, passwordErrors: { password: problem }, status: 422 });
  await users.setPassword(user.id, password);
  // Sign the user out elsewhere so the old password stops working everywhere.
  if (user.id !== req.user.id) users.endSessions(user.id);
  req.flash('success', `Password updated for ${user.name}.`);
  res.redirect(`/admin/users/${user.id}`);
});

router.post('/:id/delete', (req, res) => {
  const user = loadUser(req);
  if (!user) return notFound(res, 'user');
  if (user.id === req.user.id) {
    req.flash('error', 'You can’t delete your own account while signed in as it.');
    return res.redirect(`/admin/users/${user.id}`);
  }
  if (user.role === 'admin' && user.status === 'active' && users.activeAdminCount() <= 1) {
    req.flash('error', 'You can’t delete the last active admin.');
    return res.redirect(`/admin/users/${user.id}`);
  }
  users.endSessions(user.id);
  users.remove(user.id);
  if (user.avatar) removeUpload(user.avatar);
  req.flash('success', `Deleted ${user.name}.`);
  res.redirect('/admin/users');
});

module.exports = router;
