const fs = require('fs');
const path = require('path');
const config = require('../config');

// Sub-folders of the upload directory. `images` and `media` are served
// publicly; `videos` and `files` only through routes that check access.
const UPLOAD_DIRS = ['images', 'videos', 'files', 'media'];

function ensureUploadDirs() {
  for (const dir of UPLOAD_DIRS) fs.mkdirSync(path.join(config.uploadDir, dir), { recursive: true });
}

// Resolve a stored reference ("/uploads/images/a.png" or "videos/a.mp4") to
// an absolute path inside the upload directory, or null if it points
// anywhere else (seeded assets under /img, external URLs, traversal...).
function resolveUpload(ref) {
  if (!ref || typeof ref !== 'string') return null;
  const relative = ref.startsWith('/uploads/') ? ref.slice('/uploads/'.length) : ref;
  if (relative.startsWith('/') || /^[a-z]+:/i.test(relative)) return null;
  const absolute = path.resolve(config.uploadDir, relative);
  if (!absolute.startsWith(config.uploadDir + path.sep)) return null;
  return absolute;
}

function removeUpload(ref) {
  const absolute = resolveUpload(ref);
  if (!absolute) return;
  fs.unlink(absolute, (err) => {
    if (err && err.code !== 'ENOENT') console.warn(`Could not delete ${absolute}: ${err.message}`);
  });
}

// Public URL for files in the public sub-folders.
function publicUrl(file) {
  const relative = path.relative(config.uploadDir, file.path).split(path.sep).join('/');
  return `/uploads/${relative}`;
}

// Stored reference for files in the private sub-folders.
function privateRef(file) {
  return path.relative(config.uploadDir, file.path).split(path.sep).join('/');
}

module.exports = { ensureUploadDirs, resolveUpload, removeUpload, publicUrl, privateRef };
