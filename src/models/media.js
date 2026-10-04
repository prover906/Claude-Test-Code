const db = require('../db');

const stmts = {
  list: db.prepare(`
    SELECT m.*, u.name AS uploader_name FROM media m LEFT JOIN users u ON u.id = m.uploaded_by
    ORDER BY m.created_at DESC, m.id DESC`),
  byId: db.prepare('SELECT * FROM media WHERE id = ?'),
  insert: db.prepare('INSERT INTO media (url, original_name, mime, size, uploaded_by) VALUES (?, ?, ?, ?, ?)'),
  remove: db.prepare('DELETE FROM media WHERE id = ?'),
  count: db.prepare('SELECT COUNT(*) AS n FROM media'),
};

module.exports = {
  list: () => stmts.list.all(),
  findById: (id) => stmts.byId.get(id) || null,
  create: ({ url, originalName, mime, size }, userId) => stmts.insert.run(url, originalName, mime, size, userId).lastInsertRowid,
  remove: (id) => stmts.remove.run(id),
  count: () => stmts.count.get().n,
};
