const express = require('express');
const courses = require('../../models/courses');
const { upload, uploadedFile, discardUploads } = require('../../lib/upload');
const { publicUrl, privateRef, removeUpload } = require('../../lib/files');
const { parseYouTubeId } = require('../../lib/video');
const { slugify } = require('../../lib/slug');
const { text, checkbox, id: parseId } = require('../../lib/validate');
const { notFound, back, cleanFilename } = require('./helpers');

const router = express.Router();
const VIDEO_TYPES = ['none', 'youtube', 'upload'];

function loadCourse(req) {
  const id = parseId(req.params.id);
  return id ? courses.findById(id) : null;
}

function loadLesson(req, course) {
  const id = parseId(req.params.lessonId);
  const lesson = id ? courses.findLesson(id) : null;
  return lesson && lesson.course_id === course.id ? lesson : null;
}

// ---------------------------------------------------------------- courses

function courseValues(body) {
  return {
    title: text(body.title, { max: 150 }),
    slug: slugify(text(body.slug, { max: 100 })),
    summary: text(body.summary, { max: 300 }),
    description: text(body.description, { max: 20000 }),
    category: text(body.category, { max: 60 }) || 'General',
    level: courses.LEVELS.includes(body.level) ? body.level : 'Beginner',
    is_published: checkbox(body.is_published),
    is_featured: checkbox(body.is_featured),
  };
}

function validateCourse(req, values) {
  const errors = {};
  if (values.title.length < 3) errors.title = 'The title must be at least 3 characters.';
  if (!values.summary) errors.summary = 'Add a one-line summary. It is shown on course cards.';
  if (req.uploadError) errors.thumbnail = req.uploadError;
  return errors;
}

function renderCourseForm(res, { course = null, values, errors = {}, status = 200 }) {
  res.status(status).render('admin/courses/form', {
    title: course ? `Edit: ${course.title}` : 'New course',
    course,
    values,
    errors,
    lessons: course ? courses.lessons(course.id) : [],
    categories: courses.categories({ publishedOnly: false }),
    levels: courses.LEVELS,
  });
}

router.get('/', (req, res) => {
  const q = text(req.query.q, { max: 100 });
  const status = ['published', 'draft'].includes(req.query.status) ? req.query.status : '';
  let rows = courses.list({ publishedOnly: false, q });
  if (status) rows = rows.filter((course) => Boolean(course.is_published) === (status === 'published'));
  res.render('admin/courses/index', { title: 'Courses', courses: rows, q, status });
});

router.get('/new', (req, res) => {
  renderCourseForm(res, {
    values: { title: '', slug: '', summary: '', description: '', category: '', level: 'Beginner', is_published: false, is_featured: false },
  });
});

router.post('/', upload({ thumbnail: 'image' }), (req, res) => {
  const values = courseValues(req.body);
  const errors = validateCourse(req, values);
  if (Object.keys(errors).length) {
    discardUploads(req);
    return renderCourseForm(res, { values, errors, status: 422 });
  }
  const file = uploadedFile(req, 'thumbnail');
  const id = courses.create({ ...values, thumbnail: file ? publicUrl(file) : null }, req.user.id);
  req.flash('success', 'Course created. Now add some lessons.');
  res.redirect(`/admin/courses/${id}/edit#lessons`);
});

router.get('/:id/edit', (req, res) => {
  const course = loadCourse(req);
  if (!course) return notFound(res, 'course');
  renderCourseForm(res, { course, values: { ...course, is_published: Boolean(course.is_published), is_featured: Boolean(course.is_featured) } });
});

router.post('/:id', upload({ thumbnail: 'image' }), (req, res) => {
  const course = loadCourse(req);
  if (!course) {
    discardUploads(req);
    return notFound(res, 'course');
  }
  const values = courseValues(req.body);
  const errors = validateCourse(req, values);
  if (Object.keys(errors).length) {
    discardUploads(req);
    return renderCourseForm(res, { course, values, errors, status: 422 });
  }

  const file = uploadedFile(req, 'thumbnail');
  let thumbnail = course.thumbnail;
  if (file) thumbnail = publicUrl(file);
  else if (checkbox(req.body.remove_thumbnail)) thumbnail = null;
  courses.update(course.id, { ...values, thumbnail });
  if (course.thumbnail && course.thumbnail !== thumbnail && courses.isThumbnailOrphan(course.thumbnail)) {
    removeUpload(course.thumbnail);
  }
  req.flash('success', 'Course saved.');
  res.redirect(`/admin/courses/${course.id}/edit`);
});

router.post('/:id/toggle', (req, res) => {
  const course = loadCourse(req);
  if (!course) return notFound(res, 'course');
  courses.togglePublish(course.id);
  req.flash('success', course.is_published ? `“${course.title}” is now a draft.` : `“${course.title}” is now live.`);
  res.redirect(back(req, '/admin/courses'));
});

router.post('/:id/delete', (req, res) => {
  const course = loadCourse(req);
  if (!course) return notFound(res, 'course');
  courses.remove(course.id).forEach(removeUpload);
  req.flash('success', `Deleted “${course.title}” and its lessons.`);
  res.redirect('/admin/courses');
});

// ---------------------------------------------------------------- lessons

function lessonFormValues(lesson) {
  return {
    title: lesson.title,
    duration: lesson.duration,
    video_type: lesson.video_type,
    youtube_url: lesson.video_type === 'youtube' && lesson.video_url ? `https://www.youtube.com/watch?v=${lesson.video_url}` : '',
    content: lesson.content,
    is_preview: Boolean(lesson.is_preview),
  };
}

// Validates the lesson form and works out what to store. `existing` is the
// lesson being edited (null when creating).
function buildLesson(req, existing) {
  const body = req.body;
  const values = {
    title: text(body.title, { max: 150 }),
    duration: text(body.duration, { max: 20 }),
    video_type: VIDEO_TYPES.includes(body.video_type) ? body.video_type : 'none',
    youtube_url: text(body.youtube_url, { max: 300 }),
    content: text(body.content, { max: 50000 }),
    is_preview: checkbox(body.is_preview),
  };
  const errors = {};
  if (values.title.length < 2) errors.title = 'Give the lesson a title.';
  if (req.uploadError) errors.upload = req.uploadError;

  const videoFile = uploadedFile(req, 'video');
  const resourceFile = uploadedFile(req, 'resource');

  let videoUrl = null;
  if (values.video_type === 'youtube') {
    videoUrl = parseYouTubeId(values.youtube_url);
    if (!videoUrl) errors.youtube_url = 'Paste a YouTube link like https://www.youtube.com/watch?v=… or https://youtu.be/…';
  } else if (values.video_type === 'upload') {
    if (videoFile) videoUrl = privateRef(videoFile);
    else if (existing && existing.video_type === 'upload' && existing.video_url) videoUrl = existing.video_url;
    else if (!errors.upload) errors.video = 'Choose a video file to upload.';
  }

  let resourceFileRef = existing ? existing.resource_file : null;
  let resourceName = existing ? existing.resource_name : null;
  if (resourceFile) {
    resourceFileRef = privateRef(resourceFile);
    resourceName = cleanFilename(resourceFile.originalname);
  } else if (checkbox(body.remove_resource)) {
    resourceFileRef = null;
    resourceName = null;
  }

  return {
    values,
    errors,
    unusedVideo: videoFile && values.video_type !== 'upload' ? videoFile : null,
    data: {
      title: values.title,
      duration: values.duration,
      video_type: values.video_type,
      video_url: videoUrl,
      content: values.content,
      is_preview: values.is_preview,
      resource_file: resourceFileRef,
      resource_name: resourceName,
    },
  };
}

function renderLessonForm(res, { course, lesson = null, values, errors = {}, status = 200 }) {
  res.status(status).render('admin/courses/lesson-form', {
    title: lesson ? `Edit lesson: ${lesson.title}` : 'New lesson',
    course,
    lesson,
    values,
    errors,
  });
}

// Removes files the previous version of a lesson used and nothing uses now.
function cleanUpReplacedFiles(previous) {
  if (previous.video_type === 'upload' && previous.video_url && courses.isVideoOrphan(previous.video_url)) {
    removeUpload(previous.video_url);
  }
  if (previous.resource_file && courses.isResourceOrphan(previous.resource_file)) removeUpload(previous.resource_file);
}

router.get('/:id/lessons/new', (req, res) => {
  const course = loadCourse(req);
  if (!course) return notFound(res, 'course');
  renderLessonForm(res, {
    course,
    values: { title: '', duration: '', video_type: 'youtube', youtube_url: '', content: '', is_preview: false },
  });
});

router.post('/:id/lessons', upload({ video: 'video', resource: 'file' }), (req, res) => {
  const course = loadCourse(req);
  if (!course) {
    discardUploads(req);
    return notFound(res, 'course');
  }
  const { values, errors, data, unusedVideo } = buildLesson(req, null);
  if (Object.keys(errors).length) {
    discardUploads(req);
    return renderLessonForm(res, { course, values, errors, status: 422 });
  }
  if (unusedVideo) removeUpload(privateRef(unusedVideo));
  courses.createLesson(course.id, data);
  req.flash('success', `Lesson “${data.title}” added.`);
  if (req.body.after === 'another') return res.redirect(`/admin/courses/${course.id}/lessons/new`);
  res.redirect(`/admin/courses/${course.id}/edit#lessons`);
});

router.get('/:id/lessons/:lessonId/edit', (req, res) => {
  const course = loadCourse(req);
  const lesson = course && loadLesson(req, course);
  if (!lesson) return notFound(res, 'lesson');
  renderLessonForm(res, { course, lesson, values: lessonFormValues(lesson) });
});

router.post('/:id/lessons/:lessonId', upload({ video: 'video', resource: 'file' }), (req, res) => {
  const course = loadCourse(req);
  const lesson = course && loadLesson(req, course);
  if (!lesson) {
    discardUploads(req);
    return notFound(res, 'lesson');
  }
  const { values, errors, data, unusedVideo } = buildLesson(req, lesson);
  if (Object.keys(errors).length) {
    discardUploads(req);
    return renderLessonForm(res, { course, lesson, values, errors, status: 422 });
  }
  if (unusedVideo) removeUpload(privateRef(unusedVideo));
  courses.updateLesson(lesson.id, data);
  cleanUpReplacedFiles(lesson);
  req.flash('success', `Lesson “${data.title}” saved.`);
  res.redirect(`/admin/courses/${course.id}/edit#lessons`);
});

router.post('/:id/lessons/:lessonId/delete', (req, res) => {
  const course = loadCourse(req);
  const lesson = course && loadLesson(req, course);
  if (!lesson) return notFound(res, 'lesson');
  courses.removeLesson(lesson.id).forEach(removeUpload);
  req.flash('success', `Deleted lesson “${lesson.title}”.`);
  res.redirect(`/admin/courses/${course.id}/edit#lessons`);
});

router.post('/:id/lessons/:lessonId/move', (req, res) => {
  const course = loadCourse(req);
  const lesson = course && loadLesson(req, course);
  if (!lesson) return notFound(res, 'lesson');
  courses.moveLesson(lesson.id, req.body.direction === 'up' ? 'up' : 'down');
  res.redirect(`/admin/courses/${course.id}/edit#lessons`);
});

module.exports = router;
