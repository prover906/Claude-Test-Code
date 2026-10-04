const db = require('../db');
const { uniqueSlug } = require('../lib/slug');

const TUTORIAL_STATS = '(SELECT COUNT(*) FROM tutorial_chapters ch WHERE ch.tutorial_id = t.id) AS chapter_count';

const stmts = {
  byId: db.prepare(`SELECT t.*, ${TUTORIAL_STATS} FROM tutorials t WHERE t.id = ?`),
  bySlug: db.prepare(`SELECT t.*, ${TUTORIAL_STATS} FROM tutorials t WHERE t.slug = ?`),
  slugTaken: db.prepare('SELECT 1 FROM tutorials WHERE slug = ? AND id != ?'),
  insert: db.prepare(`
    INSERT INTO tutorials (title, slug, description, category, badge, is_published, author_id)
    VALUES (@title, @slug, @description, @category, @badge, @is_published, @author_id)`),
  update: db.prepare(`
    UPDATE tutorials SET title = @title, slug = @slug, description = @description, category = @category,
      badge = @badge, is_published = @is_published, updated_at = datetime('now')
    WHERE id = @id`),
  togglePublish: db.prepare("UPDATE tutorials SET is_published = 1 - is_published, updated_at = datetime('now') WHERE id = ?"),
  remove: db.prepare('DELETE FROM tutorials WHERE id = ?'),
  count: db.prepare('SELECT COUNT(*) AS n FROM tutorials'),
  countPublished: db.prepare('SELECT COUNT(*) AS n FROM tutorials WHERE is_published = 1'),
  allCategories: db.prepare('SELECT DISTINCT category FROM tutorials ORDER BY category'),

  chapters: db.prepare('SELECT id, tutorial_id, title, slug, position, updated_at FROM tutorial_chapters WHERE tutorial_id = ? ORDER BY position, id'),
  chapterById: db.prepare('SELECT * FROM tutorial_chapters WHERE id = ?'),
  chapterBySlug: db.prepare('SELECT * FROM tutorial_chapters WHERE tutorial_id = ? AND slug = ?'),
  chapterSlugTaken: db.prepare('SELECT 1 FROM tutorial_chapters WHERE tutorial_id = ? AND slug = ? AND id != ?'),
  maxPosition: db.prepare('SELECT COALESCE(MAX(position), 0) AS n FROM tutorial_chapters WHERE tutorial_id = ?'),
  insertChapter: db.prepare(`
    INSERT INTO tutorial_chapters (tutorial_id, title, slug, position, content)
    VALUES (@tutorial_id, @title, @slug, @position, @content)`),
  updateChapter: db.prepare(`
    UPDATE tutorial_chapters SET title = @title, slug = @slug, content = @content, updated_at = datetime('now')
    WHERE id = @id`),
  touchTutorial: db.prepare("UPDATE tutorials SET updated_at = datetime('now') WHERE id = ?"),
  removeChapter: db.prepare('DELETE FROM tutorial_chapters WHERE id = ?'),
  setPosition: db.prepare('UPDATE tutorial_chapters SET position = ? WHERE id = ?'),
  chapterCount: db.prepare('SELECT COUNT(*) AS n FROM tutorial_chapters'),
};

function list({ publishedOnly = true, q = '', limit = 0 } = {}) {
  const where = [];
  const params = {};
  if (publishedOnly) where.push('t.is_published = 1');
  if (q) {
    where.push('(t.title LIKE @q OR t.description LIKE @q OR t.category LIKE @q)');
    params.q = `%${q}%`;
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limitClause = limit ? `LIMIT ${Number(limit)}` : '';
  return db.prepare(`SELECT t.*, ${TUTORIAL_STATS} FROM tutorials t ${clause} ORDER BY t.created_at ASC, t.id ASC ${limitClause}`).all(params);
}

// Chapter-level search for the site search page.
function searchChapters(q, limit = 20) {
  return db
    .prepare(
      `SELECT ch.id, ch.title, ch.slug, ch.content, t.title AS tutorial_title, t.slug AS tutorial_slug
         FROM tutorial_chapters ch JOIN tutorials t ON t.id = ch.tutorial_id
        WHERE t.is_published = 1 AND (ch.title LIKE @q OR ch.content LIKE @q)
        ORDER BY (ch.title LIKE @q) DESC, t.id, ch.position
        LIMIT @limit`,
    )
    .all({ q: `%${q}%`, limit });
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
  return stmts.insert.run({
    ...data,
    slug: makeSlug(data.slug || data.title),
    is_published: data.is_published ? 1 : 0,
    author_id: authorId || null,
  }).lastInsertRowid;
}

function update(id, data) {
  stmts.update.run({ ...data, id, slug: makeSlug(data.slug || data.title, id), is_published: data.is_published ? 1 : 0 });
}

function togglePublish(id) {
  stmts.togglePublish.run(id);
}

function remove(id) {
  stmts.remove.run(id);
}

function categories() {
  return stmts.allCategories.all().map((row) => row.category);
}

function chapters(tutorialId) {
  return stmts.chapters.all(tutorialId);
}

function findChapter(id) {
  return stmts.chapterById.get(id) || null;
}

function findChapterBySlug(tutorialId, slug) {
  return stmts.chapterBySlug.get(tutorialId, slug) || null;
}

function makeChapterSlug(tutorialId, base, excludeId = 0) {
  return uniqueSlug(base, (candidate) => Boolean(stmts.chapterSlugTaken.get(tutorialId, candidate, excludeId)));
}

const createChapter = db.transaction((tutorialId, data) => {
  const id = stmts.insertChapter.run({
    tutorial_id: tutorialId,
    title: data.title,
    slug: makeChapterSlug(tutorialId, data.slug || data.title),
    position: stmts.maxPosition.get(tutorialId).n + 1,
    content: data.content,
  }).lastInsertRowid;
  stmts.touchTutorial.run(tutorialId);
  return id;
});

const updateChapter = db.transaction((id, data) => {
  const chapter = findChapter(id);
  if (!chapter) return;
  stmts.updateChapter.run({
    id,
    title: data.title,
    slug: makeChapterSlug(chapter.tutorial_id, data.slug || data.title, id),
    content: data.content,
  });
  stmts.touchTutorial.run(chapter.tutorial_id);
});

function removeChapter(id) {
  stmts.removeChapter.run(id);
}

const moveChapter = db.transaction((id, direction) => {
  const chapter = findChapter(id);
  if (!chapter) return;
  const ordered = stmts.chapters.all(chapter.tutorial_id);
  const index = ordered.findIndex((c) => c.id === chapter.id);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return;
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
  ordered.forEach((c, i) => stmts.setPosition.run(i + 1, c.id));
});

function stats() {
  return {
    tutorials: stmts.count.get().n,
    publishedTutorials: stmts.countPublished.get().n,
    chapters: stmts.chapterCount.get().n,
  };
}

module.exports = {
  list,
  searchChapters,
  findById,
  findBySlug,
  makeSlug,
  create,
  update,
  togglePublish,
  remove,
  categories,
  chapters,
  findChapter,
  findChapterBySlug,
  createChapter,
  updateChapter,
  removeChapter,
  moveChapter,
  stats,
};
