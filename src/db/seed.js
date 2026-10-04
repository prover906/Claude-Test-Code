const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const db = require('./index');
const users = require('../models/users');
const courses = require('../models/courses');
const tutorials = require('../models/tutorials');
const { ensureUploadDirs } = require('../lib/files');
const data = require('./seed-data');

const ASSETS = path.join(config.root, 'seed-assets');

function readContent(file) {
  return fs.readFileSync(path.join(ASSETS, 'content', file), 'utf8').trim();
}

// Copies a bundled asset into the private upload folder and returns its
// stored reference (e.g. "videos/sample-lesson.mp4").
function installAsset(file, folder) {
  const target = path.join(config.uploadDir, folder, file);
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(ASSETS, file), target);
  return `${folder}/${file}`;
}

const backdateCourse = db.prepare("UPDATE courses SET created_at = datetime('now', ?), updated_at = datetime('now', ?) WHERE id = ?");
const backdateTutorial = db.prepare("UPDATE tutorials SET created_at = datetime('now', ?) WHERE id = ?");
const backdate = db.prepare("UPDATE users SET created_at = datetime('now', ?), last_login_at = ? WHERE id = ?");
const banUser = db.prepare("UPDATE users SET status = 'banned' WHERE id = ?");

async function seedDemoContent(adminId) {
  ensureUploadDirs();
  const sampleVideo = installAsset('sample-lesson.mp4', 'videos');

  const student = await users.create({ ...config.demo.student, role: 'student' });
  backdate.run('-2 days', null, student.id);

  // A handful of learners so the user list and signup chart aren't empty.
  for (const learner of data.learners) {
    const user = await users.create({
      name: learner.name,
      email: learner.email,
      password: crypto.randomBytes(16).toString('hex'),
    });
    backdate.run(`-${learner.daysAgo} days`, null, user.id);
    if (learner.banned) banUser.run(user.id);
  }

  const courseIds = {};
  for (const [index, course] of data.courses.entries()) {
    const id = courses.create(
      {
        title: course.title,
        slug: course.slug,
        summary: course.summary,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnail: course.thumbnail || null,
        is_published: course.published,
        is_featured: course.featured,
      },
      adminId,
    );
    courseIds[course.slug] = id;
    // Lists are newest-first; stagger the dates so they follow the order above.
    backdateCourse.run(`-${index + 1} days`, `-${index + 1} days`, id);
    for (const lesson of course.lessons) {
      courses.createLesson(id, {
        title: lesson.title,
        video_type: lesson.video ? 'upload' : 'none',
        video_url: lesson.video ? sampleVideo : null,
        duration: lesson.duration || '',
        content: readContent(lesson.content),
        resource_file: lesson.resource ? installAsset(lesson.resource, 'files') : null,
        resource_name: lesson.resource || null,
        is_preview: Boolean(lesson.preview),
      });
    }
  }

  for (const [index, tutorial] of data.tutorials.entries()) {
    const id = tutorials.create(
      {
        title: tutorial.title,
        slug: tutorial.slug,
        description: tutorial.description,
        category: tutorial.category,
        badge: tutorial.badge,
        is_published: tutorial.published,
      },
      adminId,
    );
    for (const chapter of tutorial.chapters) {
      tutorials.createChapter(id, { title: chapter.title, content: readContent(chapter.content) });
    }
    backdateTutorial.run(`-${data.tutorials.length - index} days`, id);
  }

  // Give the demo student some progress to look at on their dashboard.
  for (const [slug, completed] of Object.entries(data.studentProgress)) {
    const courseId = courseIds[slug];
    courses.enroll(student.id, courseId);
    courses
      .lessons(courseId)
      .slice(0, completed)
      .forEach((lesson) => courses.setLessonComplete(student.id, lesson.id, true));
  }
}

// Creates the admin account (and optionally demo content) when the database
// has no users yet. Returns true when it seeded something.
async function ensureSeeded() {
  if (users.count() > 0) return false;
  const admin = await users.create({ ...config.demo.admin, role: 'admin' });
  if (config.seedDemoData) await seedDemoContent(admin.id);
  return true;
}

module.exports = { ensureSeeded };
