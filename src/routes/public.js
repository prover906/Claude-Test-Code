const express = require('express');
const config = require('../config');
const courses = require('../models/courses');
const tutorials = require('../models/tutorials');
const users = require('../models/users');
const { renderMarkdown, markdownToText } = require('../lib/markdown');
const { youTubeEmbedUrl } = require('../lib/video');
const { resolveUpload } = require('../lib/files');
const { requireAuth, safeRedirect } = require('../middleware/auth');
const { text, id: parseId } = require('../lib/validate');

const router = express.Router();

function notFound(res, what = 'page') {
  return res.status(404).render('errors/error', {
    title: 'Not found',
    status: 404,
    message: `We couldn't find that ${what}. It may have been removed or isn't published yet.`,
  });
}

function isAdmin(req) {
  return Boolean(req.user && req.user.role === 'admin');
}

// Published course by slug; admins can also open drafts to preview them.
function findCourse(req) {
  const course = courses.findBySlug(req.params.slug);
  if (!course || (!course.is_published && !isAdmin(req))) return null;
  return course;
}

function findTutorial(req) {
  const tutorial = tutorials.findBySlug(req.params.slug);
  if (!tutorial || (!tutorial.is_published && !isAdmin(req))) return null;
  return tutorial;
}

function canWatch(req, course, lesson) {
  if (lesson.is_preview) return true;
  if (!req.user) return false;
  return isAdmin(req) || courses.isEnrolled(req.user.id, course.id);
}

// Send visitors who can't open a lesson to the right place.
function denyLesson(req, res, course) {
  if (!req.user) {
    req.flash('info', 'Sign in and enroll (it’s free) to watch this lesson.');
    return res.redirect(`/login?next=${encodeURIComponent(`/courses/${course.slug}`)}`);
  }
  req.flash('info', 'Enroll in this course to unlock every lesson.');
  return res.redirect(`/courses/${course.slug}`);
}

// Lesson that belongs to the course in the URL.
function findLesson(req, course) {
  const lessonId = parseId(req.params.lessonId);
  const lesson = lessonId && courses.findLesson(lessonId);
  return lesson && lesson.course_id === course.id ? lesson : null;
}

router.get('/', (req, res) => {
  let featured = courses.list({ featured: true, limit: 6 });
  if (!featured.length) featured = courses.list({ limit: 6 });
  const courseStats = courses.stats();
  const tutorialStats = tutorials.stats();
  res.render('pages/home', {
    title: null,
    featured,
    tutorials: tutorials.list({ limit: 8 }),
    stats: {
      courses: courseStats.publishedCourses,
      lessons: courseStats.lessons,
      tutorials: tutorialStats.publishedTutorials,
      learners: users.countStudents(),
    },
  });
});

router.get('/courses', (req, res) => {
  const filters = {
    q: text(req.query.q, { max: 100 }),
    category: text(req.query.category, { max: 60 }),
    level: courses.LEVELS.includes(req.query.level) ? req.query.level : '',
  };
  res.render('pages/courses/index', {
    title: 'Courses',
    courses: courses.list(filters),
    categories: courses.categories(),
    levels: courses.LEVELS,
    filters,
  });
});

router.get('/courses/:slug', (req, res) => {
  const course = findCourse(req);
  if (!course) return notFound(res, 'course');
  const lessons = courses.lessons(course.id);
  const enrolled = req.user ? courses.isEnrolled(req.user.id, course.id) : false;
  const completed = req.user ? courses.completedLessonIds(req.user.id, course.id) : new Set();
  const nextLesson = lessons.find((lesson) => !completed.has(lesson.id)) || lessons[0] || null;
  res.render('pages/courses/show', {
    title: course.title,
    description: course.summary,
    course,
    lessons,
    enrolled,
    completed,
    nextLesson,
    descriptionHtml: renderMarkdown(course.description),
  });
});

router.post('/courses/:slug/enroll', requireAuth, (req, res) => {
  const course = findCourse(req);
  if (!course) return notFound(res, 'course');
  const alreadyEnrolled = courses.isEnrolled(req.user.id, course.id);
  courses.enroll(req.user.id, course.id);
  const lessons = courses.lessons(course.id);
  if (!alreadyEnrolled) req.flash('success', `You're enrolled in “${course.title}”. Happy learning!`);
  if (!lessons.length) return res.redirect(`/courses/${course.slug}`);
  const completed = courses.completedLessonIds(req.user.id, course.id);
  const next = lessons.find((lesson) => !completed.has(lesson.id)) || lessons[0];
  res.redirect(`/courses/${course.slug}/lessons/${next.id}`);
});

router.post('/courses/:slug/unenroll', requireAuth, (req, res) => {
  const course = courses.findBySlug(req.params.slug);
  if (!course) return notFound(res, 'course');
  courses.unenroll(req.user.id, course.id);
  req.flash('info', `You left “${course.title}”. Your progress is kept if you re-enroll.`);
  res.redirect(safeRedirect(req.body.returnTo, '/dashboard'));
});

router.get('/courses/:slug/lessons/:lessonId', (req, res) => {
  const course = findCourse(req);
  if (!course) return notFound(res, 'course');
  const lesson = findLesson(req, course);
  if (!lesson) return notFound(res, 'lesson');
  if (!canWatch(req, course, lesson)) return denyLesson(req, res, course);

  const lessons = courses.lessons(course.id);
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const enrolled = req.user ? courses.isEnrolled(req.user.id, course.id) : false;
  const completed = req.user ? courses.completedLessonIds(req.user.id, course.id) : new Set();

  res.render('pages/courses/lesson', {
    title: `${lesson.title} · ${course.title}`,
    description: markdownToText(lesson.content).slice(0, 160),
    course,
    lesson,
    lessons,
    index,
    prev: lessons[index - 1] || null,
    next: lessons[index + 1] || null,
    enrolled,
    completed,
    contentHtml: renderMarkdown(lesson.content),
    embedUrl: lesson.video_type === 'youtube' && lesson.video_url ? youTubeEmbedUrl(lesson.video_url) : null,
    videoSrc: lesson.video_type === 'upload' && lesson.video_url ? `/courses/${course.slug}/lessons/${lesson.id}/video` : null,
    canWatchLesson: (l) => canWatch(req, course, l),
  });
});

// Uploaded lesson videos and resources are streamed only to people who can
// watch the lesson. sendFile supports HTTP range requests for seeking.
router.get('/courses/:slug/lessons/:lessonId/video', (req, res) => {
  const course = findCourse(req);
  const lesson = course && findLesson(req, course);
  if (!lesson || lesson.video_type !== 'upload' || !resolveUpload(lesson.video_url)) return res.sendStatus(404);
  if (!canWatch(req, course, lesson)) return res.sendStatus(403);
  res.sendFile(lesson.video_url, { root: config.uploadDir, headers: { 'Cache-Control': 'private, max-age=3600' } }, (err) => {
    if (err && !res.headersSent) res.sendStatus(err.status || 404);
  });
});

router.get('/courses/:slug/lessons/:lessonId/resource', (req, res) => {
  const course = findCourse(req);
  const lesson = course && findLesson(req, course);
  const file = lesson && resolveUpload(lesson.resource_file);
  if (!file) return notFound(res, 'file');
  if (!canWatch(req, course, lesson)) return denyLesson(req, res, course);
  res.download(file, lesson.resource_name || 'resource', (err) => {
    if (err && !res.headersSent) notFound(res, 'file');
  });
});

router.post('/courses/:slug/lessons/:lessonId/complete', requireAuth, (req, res) => {
  const course = findCourse(req);
  if (!course) return notFound(res, 'course');
  const lesson = findLesson(req, course);
  if (!lesson) return notFound(res, 'lesson');
  if (!canWatch(req, course, lesson)) return denyLesson(req, res, course);

  const complete = req.body.complete !== '0';
  // Finishing a free preview lesson enrolls the learner automatically.
  courses.enroll(req.user.id, course.id);
  courses.setLessonComplete(req.user.id, lesson.id, complete);
  if (!complete) return res.redirect(`/courses/${course.slug}/lessons/${lesson.id}`);

  const lessons = courses.lessons(course.id);
  const done = courses.completedLessonIds(req.user.id, course.id);
  if (lessons.every((l) => done.has(l.id))) {
    req.flash('success', `🎉 Congratulations! You completed “${course.title}”.`);
    return res.redirect(`/courses/${course.slug}`);
  }
  const index = lessons.findIndex((l) => l.id === lesson.id);
  const next = lessons.slice(index + 1).find((l) => !done.has(l.id)) || lessons.find((l) => !done.has(l.id));
  res.redirect(`/courses/${course.slug}/lessons/${next.id}`);
});

router.get('/tutorials', (req, res) => {
  res.render('pages/tutorials/index', { title: 'Tutorials', tutorials: tutorials.list() });
});

router.get('/tutorials/:slug', (req, res) => {
  const tutorial = findTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  const chapters = tutorials.chapters(tutorial.id);
  if (chapters.length) return res.redirect(`/tutorials/${tutorial.slug}/${chapters[0].slug}`);
  res.render('pages/tutorials/chapter', {
    title: tutorial.title,
    tutorial,
    chapters,
    chapter: null,
    contentHtml: '',
    prev: null,
    next: null,
  });
});

router.get('/tutorials/:slug/:chapterSlug', (req, res) => {
  const tutorial = findTutorial(req);
  if (!tutorial) return notFound(res, 'tutorial');
  const chapter = tutorials.findChapterBySlug(tutorial.id, req.params.chapterSlug);
  if (!chapter) return notFound(res, 'chapter');
  const chapters = tutorials.chapters(tutorial.id);
  const index = chapters.findIndex((c) => c.id === chapter.id);
  res.render('pages/tutorials/chapter', {
    title: `${chapter.title} · ${tutorial.title}`,
    description: markdownToText(chapter.content).slice(0, 160),
    tutorial,
    chapters,
    chapter,
    index,
    contentHtml: renderMarkdown(chapter.content),
    prev: chapters[index - 1] || null,
    next: chapters[index + 1] || null,
  });
});

// Short plain-text excerpt around the first match of `q`.
function snippet(markdown, q, length = 160) {
  const plain = markdownToText(markdown);
  const at = plain.toLowerCase().indexOf(q.toLowerCase());
  if (at < 0) return plain.slice(0, length);
  const start = Math.max(0, at - 50);
  return `${start > 0 ? '…' : ''}${plain.slice(start, start + length)}${start + length < plain.length ? '…' : ''}`;
}

router.get('/search', (req, res) => {
  const q = text(req.query.q, { max: 100 });
  const results = q
    ? {
        courses: courses.list({ q }),
        tutorials: tutorials.list({ q }),
        chapters: tutorials.searchChapters(q).map((chapter) => ({ ...chapter, snippet: snippet(chapter.content, q) })),
      }
    : { courses: [], tutorials: [], chapters: [] };
  const total = results.courses.length + results.tutorials.length + results.chapters.length;
  res.render('pages/search', { title: q ? `Search: ${q}` : 'Search', q, results, total });
});

module.exports = router;
