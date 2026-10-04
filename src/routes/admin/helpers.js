const path = require('path');
const { safeRedirect } = require('../../middleware/auth');

function notFound(res, what = 'item') {
  return res.status(404).render('errors/error', {
    title: 'Not found',
    status: 404,
    message: `That ${what} doesn't exist. It may have been deleted.`,
  });
}

// Where to go after a quick action (publish toggle, reorder...): the page
// the form asked for, else the fallback.
function back(req, fallback) {
  return safeRedirect(req.body && req.body.returnTo, fallback);
}

// A download-safe version of an uploaded file's original name.
function cleanFilename(name) {
  const base = path.basename(String(name || 'file')).replace(/[\u0000-\u001f\u007f"\\/]/g, '').trim();
  return base.slice(-120) || 'file';
}

module.exports = { notFound, back, cleanFilename };
