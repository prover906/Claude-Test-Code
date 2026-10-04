const express = require('express');
const courses = require('../../models/courses');
const tutorials = require('../../models/tutorials');
const users = require('../../models/users');
const media = require('../../models/media');
const { requireAdmin } = require('../../middleware/auth');
const { renderMarkdown } = require('../../lib/markdown');

const router = express.Router();

router.use(requireAdmin);
router.use((req, res, next) => {
  res.locals.adminSection = req.path.split('/')[1] || 'dashboard';
  next();
});

// Column-chart model: a clean y-scale (0, step, 2*step...) and bar heights
// as percentages of the top tick.
function columnChart(days) {
  const peak = Math.max(0, ...days.map((day) => day.count));
  const rough = Math.max(peak / 4, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough);
  const top = Math.max(step, Math.ceil(peak / step) * step);
  const ticks = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return {
    peak,
    top,
    ticks,
    bars: days.map((day) => ({
      ...day,
      label: new Date(`${day.day}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      pct: (day.count / top) * 100,
    })),
  };
}

router.get('/', (req, res) => {
  const signups = users.signupsByDay(14);
  res.render('admin/dashboard', {
    title: 'Dashboard',
    stats: {
      users: users.count(),
      ...courses.stats(),
      ...tutorials.stats(),
      media: media.count(),
    },
    chart: columnChart(signups),
    signupsTotal: signups.reduce((sum, day) => sum + day.count, 0),
    recentUsers: users.recent(6),
    popularCourses: courses.popular(5),
  });
});

// Live Markdown preview for the editors.
router.post('/preview', (req, res) => {
  const markdown = typeof req.body.markdown === 'string' ? req.body.markdown : '';
  res.json({ html: renderMarkdown(markdown) });
});

router.use('/courses', require('./courses'));
router.use('/tutorials', require('./tutorials'));
router.use('/users', require('./users'));
router.use('/media', require('./media'));

module.exports = router;
