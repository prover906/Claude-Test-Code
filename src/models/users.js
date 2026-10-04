const bcrypt = require('bcryptjs');
const db = require('../db');

const ROLES = ['student', 'admin'];
const STATUSES = ['active', 'banned'];
const COLUMNS = 'id, name, email, role, status, bio, avatar, created_at, last_login_at';
const BCRYPT_ROUNDS = 10;
// Compared against when an email doesn't exist, so response timing doesn't
// reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const stmts = {
  byId: db.prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`),
  byEmailWithHash: db.prepare(`SELECT ${COLUMNS}, password_hash FROM users WHERE email = ?`),
  emailTaken: db.prepare('SELECT 1 FROM users WHERE email = ? AND id != ?'),
  insert: db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'),
  updateProfile: db.prepare('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?'),
  updateByAdmin: db.prepare('UPDATE users SET name = ?, email = ?, role = ?, status = ?, bio = ? WHERE id = ?'),
  setPassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
  getHash: db.prepare('SELECT password_hash FROM users WHERE id = ?'),
  touchLogin: db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?"),
  remove: db.prepare('DELETE FROM users WHERE id = ?'),
  activeAdmins: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND status = 'active'"),
  count: db.prepare('SELECT COUNT(*) AS n FROM users'),
  countStudents: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'student' AND status = 'active'"),
  recent: db.prepare(`SELECT ${COLUMNS} FROM users ORDER BY created_at DESC, id DESC LIMIT ?`),
  signupsSince: db.prepare(
    "SELECT date(created_at) AS day, COUNT(*) AS n FROM users WHERE created_at >= datetime('now', ?) GROUP BY day ORDER BY day",
  ),
  deleteSessions: db.prepare("DELETE FROM sessions WHERE json_extract(sess, '$.userId') = ?"),
};

function findById(id) {
  return stmts.byId.get(id) || null;
}

function findByEmailWithHash(email) {
  return stmts.byEmailWithHash.get(String(email || '').trim()) || null;
}

function emailTaken(email, exceptId = 0) {
  return Boolean(stmts.emailTaken.get(String(email).trim(), exceptId));
}

async function create({ name, email, password, role = 'student' }) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = stmts.insert.run(name.trim(), email.trim().toLowerCase(), hash, ROLES.includes(role) ? role : 'student');
  return findById(result.lastInsertRowid);
}

async function verifyPassword(email, password) {
  const user = findByEmailWithHash(email);
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  delete user.password_hash;
  return user;
}

async function checkPassword(id, password) {
  const row = stmts.getHash.get(id);
  return row ? bcrypt.compare(password, row.password_hash) : false;
}

async function setPassword(id, password) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  stmts.setPassword.run(hash, id);
}

function updateProfile(id, { name, bio, avatar }) {
  stmts.updateProfile.run(name, bio, avatar || null, id);
}

function updateByAdmin(id, { name, email, role, status, bio }) {
  stmts.updateByAdmin.run(name, email.toLowerCase(), role, status, bio, id);
}

function touchLogin(id) {
  stmts.touchLogin.run(id);
}

function remove(id) {
  stmts.remove.run(id);
}

// Signs the user out everywhere (used when banning or deleting).
function endSessions(id) {
  stmts.deleteSessions.run(id);
}

function activeAdminCount() {
  return stmts.activeAdmins.get().n;
}

function count() {
  return stmts.count.get().n;
}

function countStudents() {
  return stmts.countStudents.get().n;
}

function recent(limit = 5) {
  return stmts.recent.all(limit);
}

// Daily signup counts for the last `days` days, zero-filled.
function signupsByDay(days = 14) {
  const rows = stmts.signupsSince.all(`-${days - 1} days`);
  const counts = new Map(rows.map((row) => [row.day, row.n]));
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = day.toISOString().slice(0, 10);
    result.push({ day: key, count: counts.get(key) || 0 });
  }
  return result;
}

function list({ q = '', role = '', status = '', page = 1, perPage = 20 } = {}) {
  const where = [];
  const params = {};
  if (q) {
    where.push('(u.name LIKE @q OR u.email LIKE @q)');
    params.q = `%${q}%`;
  }
  if (ROLES.includes(role)) {
    where.push('u.role = @role');
    params.role = role;
  }
  if (STATUSES.includes(status)) {
    where.push('u.status = @status');
    params.status = status;
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM users u ${clause}`).get(params).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pages);
  const rows = db
    .prepare(
      `SELECT ${COLUMNS.split(', ').map((c) => `u.${c}`).join(', ')},
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrollment_count
         FROM users u ${clause}
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT @limit OFFSET @offset`,
    )
    .all({ ...params, limit: perPage, offset: (current - 1) * perPage });
  return { rows, total, page: current, pages };
}

module.exports = {
  ROLES,
  STATUSES,
  findById,
  emailTaken,
  create,
  verifyPassword,
  checkPassword,
  setPassword,
  updateProfile,
  updateByAdmin,
  touchLogin,
  remove,
  endSessions,
  activeAdminCount,
  count,
  countStudents,
  recent,
  signupsByDay,
  list,
};
