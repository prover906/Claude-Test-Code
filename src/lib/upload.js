const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config');

const MB = 1024 * 1024;

const IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const VIDEO_TYPES = { 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv', 'video/quicktime': '.mov' };
const FILE_TYPES = {
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/x-zip': '.zip',
  'application/gzip': '.gz',
  'application/x-gzip': '.gz',
  'application/x-tar': '.tar',
  'application/x-7z-compressed': '.7z',
  'application/vnd.rar': '.rar',
  'application/x-rar-compressed': '.rar',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'text/csv': '.csv',
  'application/json': '.json',
};

const KINDS = {
  image: { label: 'Image', dir: 'images', types: IMAGE_TYPES, maxMb: 5, hint: 'JPG, PNG, WebP or GIF' },
  video: { label: 'Video', dir: 'videos', types: VIDEO_TYPES, maxMb: config.maxVideoMb, hint: 'MP4, WebM, OGG or MOV' },
  file: { label: 'File', dir: 'files', types: FILE_TYPES, maxMb: 50, hint: 'PDF, ZIP, TAR, 7Z, RAR, TXT, MD, CSV or JSON' },
  media: {
    label: 'File',
    dir: 'media',
    types: { ...IMAGE_TYPES, ...VIDEO_TYPES, 'application/pdf': '.pdf', 'application/zip': '.zip', 'application/x-zip-compressed': '.zip' },
    maxMb: config.maxVideoMb,
    hint: 'images, videos, PDF or ZIP',
  },
};

// Lesson resources are always served as downloads, so for them an allowed
// extension is enough when the browser sends a generic type (it often does
// for .rar, .7z and .md files).
const DOWNLOAD_EXTENSIONS = new Set(Object.values(FILE_TYPES));

function extensionFor(kindName, file) {
  const byType = KINDS[kindName].types[file.mimetype];
  if (byType) return byType;
  if (kindName === 'file') {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (DOWNLOAD_EXTENSIONS.has(ext)) return ext;
  }
  return null;
}

class UploadError extends Error {}

function friendlyMulterError(err) {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return 'That file is too large.';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Unexpected file field in the upload.';
    case 'LIMIT_FILE_COUNT':
      return 'Too many files in one upload.';
    default:
      return `Upload failed: ${err.message}`;
  }
}

// Build middleware that accepts one optional file per field, e.g.
// upload({ thumbnail: 'image' }) or upload({ video: 'video', resource: 'file' }).
// Validation problems don't throw: they land in req.uploadError so the route
// can re-render its form with a message. Rejected files are deleted.
function upload(fieldKinds) {
  const maxBytes = Math.max(...Object.values(fieldKinds).map((kind) => KINDS[kind].maxMb)) * MB;

  const middleware = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, path.join(config.uploadDir, KINDS[fieldKinds[file.fieldname]].dir));
      },
      filename(req, file, cb) {
        const ext = extensionFor(fieldKinds[file.fieldname], file);
        cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: maxBytes, files: Object.keys(fieldKinds).length, fields: 60, fieldSize: 2 * MB },
    fileFilter(req, file, cb) {
      const kind = KINDS[fieldKinds[file.fieldname]];
      if (!kind) return cb(new UploadError('Unexpected file field in the upload.'));
      if (!extensionFor(fieldKinds[file.fieldname], file)) {
        return cb(new UploadError(`"${file.originalname}" is not supported. Allowed: ${kind.hint}.`));
      }
      cb(null, true);
    },
  }).fields(Object.keys(fieldKinds).map((name) => ({ name, maxCount: 1 })));

  return (req, res, next) => {
    middleware(req, res, (err) => {
      const files = Object.values(req.files || {}).flat();
      if (!err) {
        for (const file of files) {
          const kind = KINDS[fieldKinds[file.fieldname]];
          if (file.size > kind.maxMb * MB) {
            err = new UploadError(`"${file.originalname}" is too large. ${kind.label}s can be up to ${kind.maxMb} MB.`);
            break;
          }
        }
      }
      if (err) {
        for (const file of files) fs.unlink(file.path, () => {});
        req.files = {};
        if (err instanceof multer.MulterError) err = new UploadError(friendlyMulterError(err));
        if (!(err instanceof UploadError)) return next(err);
        req.uploadError = err.message;
      }
      req.body = req.body || {};
      next();
    });
  };
}

function uploadedFile(req, field) {
  return (req.files && req.files[field] && req.files[field][0]) || null;
}

// Deletes this request's uploads, e.g. when the rest of the form is invalid.
function discardUploads(req) {
  for (const file of Object.values(req.files || {}).flat()) fs.unlink(file.path, () => {});
  req.files = {};
}

module.exports = { upload, uploadedFile, discardUploads, KINDS, UploadError };
