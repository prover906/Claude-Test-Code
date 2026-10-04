const express = require('express');
const media = require('../../models/media');
const { upload, uploadedFile } = require('../../lib/upload');
const { publicUrl, removeUpload } = require('../../lib/files');
const { id: parseId } = require('../../lib/validate');
const { notFound, cleanFilename } = require('./helpers');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('admin/media', { title: 'Media library', items: media.list(), error: null });
});

router.post('/', upload({ file: 'media' }), (req, res) => {
  const file = uploadedFile(req, 'file');
  if (req.uploadError || !file) {
    return res.status(422).render('admin/media', {
      title: 'Media library',
      items: media.list(),
      error: req.uploadError || 'Choose a file to upload.',
    });
  }
  media.create(
    { url: publicUrl(file), originalName: cleanFilename(file.originalname), mime: file.mimetype, size: file.size },
    req.user.id,
  );
  req.flash('success', `Uploaded ${cleanFilename(file.originalname)}. Copy its link to use it in lessons or tutorials.`);
  res.redirect('/admin/media');
});

router.post('/:id/delete', (req, res) => {
  const id = parseId(req.params.id);
  const item = id ? media.findById(id) : null;
  if (!item) return notFound(res, 'file');
  media.remove(item.id);
  removeUpload(item.url);
  req.flash('success', `Deleted ${item.original_name}.`);
  res.redirect('/admin/media');
});

module.exports = router;
