const express = require('express');
const courses = require('../models/courses');
const users = require('../models/users');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadedFile, discardUploads } = require('../lib/upload');
const { publicUrl, removeUpload } = require('../lib/files');
const { text, checkbox, passwordProblem } = require('../lib/validate');

const router = express.Router();

router.get('/dashboard', requireAuth, (req, res) => {
  const enrolled = courses.enrollmentsForUser(req.user.id).map((course) => {
    const lessons = courses.lessons(course.id);
    const completed = courses.completedLessonIds(req.user.id, course.id);
    const next = lessons.find((lesson) => !completed.has(lesson.id)) || null;
    return { ...course, nextLesson: next, done: lessons.length > 0 && !next };
  });
  const totals = enrolled.reduce(
    (acc, course) => ({
      lessons: acc.lessons + course.lesson_count,
      completed: acc.completed + course.completed_count,
      finished: acc.finished + (course.done ? 1 : 0),
    }),
    { lessons: 0, completed: 0, finished: 0 },
  );
  const enrolledIds = new Set(enrolled.map((course) => course.id));
  const suggestions = courses
    .list()
    .filter((course) => !enrolledIds.has(course.id))
    .slice(0, 3);
  res.render('pages/user/dashboard', { title: 'My learning', enrolled, totals, suggestions });
});

function renderAccount(req, res, { values, errors = {}, passwordErrors = {}, status = 200 } = {}) {
  res.status(status).render('pages/user/account', {
    title: 'Account settings',
    values: values || { name: req.user.name, bio: req.user.bio },
    errors,
    passwordErrors,
  });
}

router.get('/account', requireAuth, (req, res) => renderAccount(req, res));

router.post('/account', requireAuth, upload({ avatar: 'image' }), (req, res) => {
  const values = { name: text(req.body.name, { max: 80 }), bio: text(req.body.bio, { max: 500 }) };
  const errors = {};
  if (values.name.length < 2) errors.name = 'Please enter your name.';
  if (req.uploadError) errors.avatar = req.uploadError;

  if (Object.keys(errors).length) {
    discardUploads(req);
    return renderAccount(req, res, { values, errors, status: 422 });
  }

  const file = uploadedFile(req, 'avatar');
  let avatar = req.user.avatar;
  if (file || checkbox(req.body.remove_avatar)) {
    if (avatar) removeUpload(avatar);
    avatar = file ? publicUrl(file) : null;
  }
  users.updateProfile(req.user.id, { ...values, avatar });
  req.flash('success', 'Your profile has been updated.');
  res.redirect('/account');
});

router.post('/account/password', requireAuth, async (req, res, next) => {
  const current = typeof req.body.current_password === 'string' ? req.body.current_password : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const confirm = typeof req.body.confirm === 'string' ? req.body.confirm : '';
  const passwordErrors = {};

  if (!(await users.checkPassword(req.user.id, current))) passwordErrors.current_password = 'Your current password is incorrect.';
  const problem = passwordProblem(password);
  if (problem) passwordErrors.password = problem;
  else if (password !== confirm) passwordErrors.confirm = 'Passwords do not match.';
  if (Object.keys(passwordErrors).length) return renderAccount(req, res, { passwordErrors, status: 422 });

  await users.setPassword(req.user.id, password);
  // Sign out every other device, then start a fresh session here.
  const userId = req.user.id;
  users.endSessions(userId);
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.userId = userId;
    req.flash('success', 'Your password has been changed. Other devices have been signed out.');
    res.redirect('/account');
  });
});

module.exports = router;
