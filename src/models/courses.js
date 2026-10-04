const db = require('../db');
const { uniqueSlug } = require('../lib/slug');

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const COURSE_STATS = `
  (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
  (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrollment_count`;

const stmts = {
  byId: db.prepare(`SELECT c.*, ${COURSE_STATS} FROM courses c WHERE c.id = ?`),
  bySlug: db.prepare(
    `SELECT c.*, u.name AS author_name, ${COURSE_STATS} FROM courses c LEFT JOIN users u ON u.id = c.author_id WHERE c.slug = ?`,
  ),
  slugTaken: db.prepare('SELECT 1 FROM courses WHERE slug = ? AND id != ?'),
  insert: db.prepare(`
    INSERT INTO courses (title, slug, summary, description, category, level, thumbnail, is_published, is_featured, author_id)
    VALUES (@title, @slug, @summary, @description, @category, @level, @thumbnail, @is_published, @is_featured, @author_id)`),
  update: db.prepare(`
    UPDATE courses SET title = @title, slug = @slug, summary = @summary, description = @description,
      category = @category, level = @level, thumbnail = @thumbnail, is_published = @is_published,
      is_featured = @is_featured, updated_at = datetime('now')
    WHERE id = @id`),
  togglePublish: db.prepare("UPDATE courses SET is_published = 1 - is_published, updated_at = datetime('now') WHERE id = ?"),
  remove: db.prepare('DELETE FROM courses WHERE id = ?'),
  categories: db.prepare('SELECT DISTINCT category FROM courses WHERE is_published = 1 ORDER BY category'),
  allCategories: db.prepare('SELECT DISTINCT category FROM courses ORDER BY category'),
  count: db.prepare('SELECT COUNT(*) AS n FROM courses'),
  countPublished: db.prepare('SELECT COUNT(*) AS n FROM courses WHERE is_published = 1'),
  popular: db.prepare(
    `SELECT c.*, ${COURSE_STATS} FROM courses c ORDER BY enrollment_count DESC, c.created_at DESC LIMIT ?`,
  ),

  lessons: db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY position, id'),
  lessonById: db.prepare('SELECT * FROM lessons WHERE id = ?'),
  maxPosition: db.prepare('SELECT COALESCE(MAX(position), 0) AS n FROM lessons WHERE course_id = ?'),
  insertLesson: db.prepare(`
    INSERT INTO lessons (course_id, title, position, video_type, video_url, duration, content, resource_file, resource_name, is_preview)
    VALUES (@course_id, @title, @position, @video_type, @video_url, @duration, @content, @resource_file, @resource_name, @is_preview)`),
  updateLesson: db.prepare(`
    UPDATE lessons SET title = @title, video_type = @video_type, video_url = @video_url, duration = @duration,
      content = @content, resource_file = @resource_file, resource_name = @resource_name, is_preview = @is_preview,
      updated_at = datetime('now')
    WHERE id = @id`),
  removeLesson: db.prepare('DELETE FROM lessons WHERE id = ?'),
  setPosition: db.prepare('UPDATE lessons SET position = ? WHERE id = ?'),
  lessonCount: db.prepare('SELECT COUNT(*) AS n FROM lessons'),
  videoRefCount: db.prepare("SELECT COUNT(*) AS n FROM lessons WHERE video_type = 'upload' AND video_url = ?"),
  resourceRefCount: db.prepare('SELECT COUNT(*) AS n FROM lessons WHERE resource_file = ?'),
  thumbnailRefCount: db.prepare('SELECT COUNT(*) AS n FROM courses WHERE thumbnail = ?'),

  enroll: db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)'),
  unenroll: db.prepare('DELETE FROM enrollments WHERE user_id = ? AND course_id = ?'),
  isEnrolled: db.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?'),
  enrollmentCount: db.prepare('SELECT COUNT(*) AS n FROM enrollments'),
  enrollmentsForUser: db.prepare(`
    SELECT c.*, e.created_at AS enrolled_at, ${COURSE_STATS},
      (SELECT COUNT(*) FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
        WHERE p.user_id = e.user_id AND l.course_id = c.id) AS completed_count
    FROM enrollments e JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ?
    ORDER BY e.created_at DESC`),
  completedIds: db.prepare(`
    SELECT p.lesson_id FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
    WHERE p.user_id = ? AND l.course_id = ?`),
  markComplete: db.prepare('INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)'),
  markIncomplete: db.prepare('DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?'),
};

function list({ publishedOnly = true, q = '', category = '', level = '', featured = false, limit = 0 } = {}) {
  const where = [];
  const params = {};
  if (publishedOnly) where.push('c.is_published = 1');
  if (featured) where.push('c.is_featured = 1');
  if (q) {
    where.push('(c.title LIKE @q OR c.summary LIKE @q OR c.category LIKE @q OR c.description LIKE @q)');
    params.q = `%${q}%`;
  }
  if (category) {
    where.push('c.category = @category');
    params.category = category;
  }
  if (LEVELS.includes(level)) {
    where.push('c.level = @level');
    params.level = level;
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';
  return db
    .prepare(`SELECT c.*, ${COURSE_STATS} FROM courses c ${clause} ORDER BY c.is_featured DESC, c.created_at DESC, c.id DESC ${limitClause}`)
    .all(params);
}

function findById(id) {
  return stmts.byId.get(id) || null;
}

function findBySlug(slug) {
  return stmts.bySlug.get(slug) || null;
}

function makeSlug(base, excludeId = 0) {
  return uniqueSlug(base, (candidate) => Boolean(stmts.slugTaken.get(candidate, excludeId)));
}

function create(data, authorId) {
  const row = {
    ...data,
    slug: makeSlug(data.slug || data.title),
    is_published: data.is_published ? 1 : 0,
    is_featured: data.is_featured ? 1 : 0,
    author_id: authorId || null,
  };
  return stmts.insert.run(row).lastInsertRowid;
}

function update(id, data) {
  stmts.update.run({
    ...data,
    id,
    slug: makeSlug(data.slug || data.title, id),
    is_published: data.is_published ? 1 : 0,
    is_featured: data.is_featured ? 1 : 0,
  });
}

function togglePublish(id) {
  stmts.togglePublish.run(id);
}

// Deletes the course (lessons cascade) and returns the uploaded files that
// nothing references any more, so the caller can remove them from disk.
const remove = db.transaction((id) => {
  const course = findById(id);
  if (!course) return [];
  const lessons = stmts.lessons.all(id);
  stmts.remove.run(id);
  const orphans = [];
  if (course.thumbnail && stmts.thumbnailRefCount.get(course.thumbnail).n === 0) orphans.push(course.thumbnail);
  for (const lesson of lessons) {
    if (lesson.video_type === 'upload' && lesson.video_url && stmts.videoRefCount.get(lesson.video_url).n === 0) {
      orphans.push(lesson.video_url);
    }
    if (lesson.resource_file && stmts.resourceRefCount.get(lesson.resource_file).n === 0) orphans.push(lesson.resource_file);
  }
  return [...new Set(orphans)];
});

function categories({ publishedOnly = true } = {}) {
  return (publishedOnly ? stmts.categories : stmts.allCategories).all().map((row) => row.category);
}

function lessons(courseId) {
  return stmts.lessons.all(courseId);
}

function findLesson(id) {
  return stmts.lessonById.get(id) || null;
}

function createLesson(courseId, data) {
  const position = stmts.maxPosition.get(courseId).n + 1;
  return stmts.insertLesson.run({ ...data, course_id: courseId, position, is_preview: data.is_preview ? 1 : 0 }).lastInsertRowid;
}

function updateLesson(id, data) {
  stmts.updateLesson.run({ ...data, id, is_preview: data.is_preview ? 1 : 0 });
}

// True when no lesson references this uploaded video/resource any more.
function isVideoOrphan(ref) {
  return stmts.videoRefCount.get(ref).n === 0;
}

function isResourceOrphan(ref) {
  return stmts.resourceRefCount.get(ref).n === 0;
}

function isThumbnailOrphan(ref) {
  return stmts.thumbnailRefCount.get(ref).n === 0;
}

const removeLesson = db.transaction((id) => {
  const lesson = findLesson(id);
  if (!lesson) return [];
  stmts.removeLesson.run(id);
  const orphans = [];
  if (lesson.video_type === 'upload' && lesson.video_url && isVideoOrphan(lesson.video_url)) orphans.push(lesson.video_url);
  if (lesson.resource_file && isResourceOrphan(lesson.resource_file)) orphans.push(lesson.resource_file);
  return orphans;
});

// Swap a lesson with its neighbour. Positions are renumbered 1..n first so
// gaps or duplicates from older data can't break ordering.
const moveLesson = db.transaction((id, direction) => {
  const lesson = findLesson(id);
  if (!lesson) return;
  const ordered = stmts.lessons.all(lesson.course_id);
  const index = ordered.findIndex((l) => l.id === lesson.id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  ordered.forEach((l, i) => stmts.setPosition.run(i + 1, l.id));
});

function enroll(userId, courseId) {
  stmts.enroll.run(userId, courseId);
}

function unenroll(userId, courseId) {
  stmts.unenroll.run(userId, courseId);
}

function isEnrolled(userId, courseId) {
  return Boolean(userId && stmts.isEnrolled.get(userId, courseId));
}

function enrollmentsForUser(userId) {
  return stmts.enrollmentsForUser.all(userId);
}

function completedLessonIds(userId, courseId) {
  if (!userId) return new Set();
  return new Set(stmts.completedIds.all(userId, courseId).map((row) => row.lesson_id));
}

function setLessonComplete(userId, lessonId, complete) {
  if (complete) stmts.markComplete.run(userId, lessonId);
  else stmts.markIncomplete.run(userId, lessonId);
}

function stats() {
  return {
    courses: stmts.count.get().n,
    publishedCourses: stmts.countPublished.get().n,
    lessons: stmts.lessonCount.get().n,
    enrollments: stmts.enrollmentCount.get().n,
  };
}

function popular(limit = 5) {
  return stmts.popular.all(limit);
}

module.exports = {
  LEVELS,
  list,
  findById,
  findBySlug,
  makeSlug,
  create,
  update,
  togglePublish,
  remove,
  categories,
  lessons,
  findLesson,
  createLesson,
  updateLesson,
  removeLesson,
  moveLesson,
  isVideoOrphan,
  isResourceOrphan,
  isThumbnailOrphan,
  enroll,
  unenroll,
  isEnrolled,
  enrollmentsForUser,
  completedLessonIds,
  setLessonComplete,
  stats,
  popular,
};
