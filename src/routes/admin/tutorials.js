const express = require('express');
const tutorials = require('../../models/tutorials');
const { slugify } = require('../../lib/slug');
const { text, checkbox, id: parseId } = require('../../lib/validate');
const { notFound, back } = require('./helpers');

const router = express.Router();

function loadTutorial(req) {
  const id = parseId(req.params.id);
  return id ? tutorials.findById(id) : null;
}

function loadChapter(req, tutorial) {
  const id = parseId(req.params.chapterId);
  const chapter = id ? tutorials.findChapter(id) : null;
  return chapter && chapter.tutorial_id === tutorial.id ? chapter : null;
}

// --------------------------------------------------------------- tutorials

function tutorialValues(body) {
  const title = text(body.title, { max: 150 });
  return {
    title,
    slug: slugify(text(body.slug, { max: 100 })),
    description: text(body.description, { max: 500 }),
    category: text(body.category, { max: 60 }) || 'General',
    badge: text(body.badge, { max: 4 }) || title.slice(0, 2),
    is_published: checkbox(body.is_published),
  };
}

function validateTutorial(values) {
  const errors = {};
  if (values.title.length < 3) errors.title = 'The title must be at least 3 characters.';
  if (!values.description) errors.description = 'Add a short description. It is shown on the tutorials page.';
  return errors;
}

function renderTutorialForm(res, { tutorial = null, values, errors = {}, status = 200 }) {
  res.status(status).render('admin/tutorials/form', {
    title: tutorial ? `Edit: ${tutorial.title}` : 'New tutorial',
    tutorial,
    values,
    errors,
    chapters: tutorial ? tutorials.chapters(tutorial.id) : [],
    categories: tutorials.categories(),
  });
}

router.get('/', (req, res) => {
  const q = text(req.query.q, { max: 100 });
  res.render('admin/tutorials/index', { title: 'Tutorials', tutorials: tutorials.list({ publishedOnly: false, q }), q });
});

router.get('/new', (req, res) => {
  renderTutorialForm(res, { values: { title: '', slug: '', description: '', category: '', badge: '', is_published: false } });
});

router.post('/', (req, res) => {
  const values = tutorialValues(req.body);
  const errors = validateTutorial(values);
  if (Object.keys(errors).length) return renderTutorialForm(res, { values, errors, status: 422 });
  const id = tutorials.create(values, req.user.id);
  req.flash('success', 'Tutorial created. Now write the first chapter.');
  res.redirect(`/admin/tutorials/${id}/chapters/new`);
});

router.get('/:id/edit', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  renderTutorialForm(res, { tutorial, values: { ...tutorial, is_published: Boolean(tutorial.is_published) } });
});

router.post('/:id', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  const values = tutorialValues(req.body);
  const errors = validateTutorial(values);
  if (Object.keys(errors).length) return renderTutorialForm(res, { tutorial, values, errors, status: 422 });
  tutorials.update(tutorial.id, values);
  req.flash('success', 'Tutorial saved.');
  res.redirect(`/admin/tutorials/${tutorial.id}/edit`);
});

router.post('/:id/toggle', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  tutorials.togglePublish(tutorial.id);
  req.flash('success', tutorial.is_published ? `“${tutorial.title}” is now a draft.` : `“${tutorial.title}” is now live.`);
  res.redirect(back(req, '/admin/tutorials'));
});

router.post('/:id/delete', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  tutorials.remove(tutorial.id);
  req.flash('success', `Deleted “${tutorial.title}” and its chapters.`);
  res.redirect('/admin/tutorials');
});

// ---------------------------------------------------------------- chapters

function chapterValues(body) {
  return {
    title: text(body.title, { max: 150 }),
    slug: slugify(text(body.slug, { max: 100 })),
    content: text(body.content, { max: 100000 }),
  };
}

function validateChapter(values) {
  const errors = {};
  if (values.title.length < 2) errors.title = 'Give the chapter a title.';
  if (!values.content) errors.content = 'Write some content for this chapter.';
  return errors;
}

function renderChapterForm(res, { tutorial, chapter = null, values, errors = {}, status = 200 }) {
  res.status(status).render('admin/tutorials/chapter-form', {
    title: chapter ? `Edit chapter: ${chapter.title}` : 'New chapter',
    tutorial,
    chapter,
    values,
    errors,
  });
}

router.get('/:id/chapters/new', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  renderChapterForm(res, { tutorial, values: { title: '', slug: '', content: '' } });
});

router.post('/:id/chapters', (req, res) => {
  const tutorial = loadTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  const values = chapterValues(req.body);
  const errors = validateChapter(values);
  if (Object.keys(errors).length) return renderChapterForm(res, { tutorial, values, errors, status: 422 });
  tutorials.createChapter(tutorial.id, values);
  req.flash('success', `Chapter “${values.title}” added.`);
  if (req.body.after === 'another') return res.redirect(`/admin/tutorials/${tutorial.id}/chapters/new`);
  res.redirect(`/admin/tutorials/${tutorial.id}/edit#chapters`);
});

router.get('/:id/chapters/:chapterId/edit', (req, res) => {
  const tutorial = loadTutorial(req);
  const chapter = tutorial && loadChapter(req, tutorial);
  if (!chapter) return notFound(res, 'chapter');
  renderChapterForm(res, { tutorial, chapter, values: chapter });
});

router.post('/:id/chapters/:chapterId', (req, res) => {
  const tutorial = loadTutorial(req);
  const chapter = tutorial && loadChapter(req, tutorial);
  if (!chapter) return notFound(res, 'chapter');
  const values = chapterValues(req.body);
  const errors = validateChapter(values);
  if (Object.keys(errors).length) return renderChapterForm(res, { tutorial, chapter, values, errors, status: 422 });
  tutorials.updateChapter(chapter.id, values);
  req.flash('success', `Chapter “${values.title}” saved.`);
  res.redirect(`/admin/tutorials/${tutorial.id}/edit#chapters`);
});

router.post('/:id/chapters/:chapterId/delete', (req, res) => {
  const tutorial = loadTutorial(req);
  const chapter = tutorial && loadChapter(req, tutorial);
  if (!chapter) return notFound(res, 'chapter');
  tutorials.removeChapter(chapter.id);
  req.flash('success', `Deleted chapter “${chapter.title}”.`);
  res.redirect(`/admin/tutorials/${tutorial.id}/edit#chapters`);
});

router.post('/:id/chapters/:chapterId/move', (req, res) => {
  const tutorial = loadTutorial(req);
  const chapter = tutorial && loadChapter(req, tutorial);
  if (!chapter) return notFound(res, 'chapter');
  tutorials.moveChapter(chapter.id, req.body.direction === 'up' ? 'up' : 'down');
  res.redirect(`/admin/tutorials/${tutorial.id}/edit#chapters`);
});

module.exports = router;
