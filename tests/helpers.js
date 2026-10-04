// Shared test setup: every test file runs in its own process with a fresh
// temporary data directory, so tests never touch the real database.
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'codenest-test-'));
process.env.DATA_DIR = path.join(tmp, 'data');
process.env.UPLOAD_DIR = path.join(tmp, 'uploads');
process.env.SESSION_SECRET = 'test-secret';
process.env.AUTH_RATE_LIMIT = '1000';
process.env.SEED_DEMO_DATA = 'true';

const request = require('supertest');
const config = require('../src/config');
const createApp = require('../src/app');
const { ensureSeeded } = require('../src/db/seed');

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

async function setup() {
  await ensureSeeded();
  return createApp();
}

function cleanup() {
  fs.rmSync(tmp, { recursive: true, force: true });
}

function csrfFrom(html) {
  const match = html.match(/name="csrf-token" content="([^"]+)"/) || html.match(/name="_csrf" value="([^"]+)"/);
  return match ? match[1] : null;
}

// Current CSRF token for an agent's session.
async function csrf(agent, page = '/') {
  const res = await agent.get(page);
  return csrfFrom(res.text);
}

async function login(app, email, password) {
  const agent = request.agent(app);
  const token = await csrf(agent, '/login');
  const res = await agent.post('/login').type('form').send({ _csrf: token, email, password });
  return { agent, res };
}

function loginAdmin(app) {
  return login(app, config.demo.admin.email, config.demo.admin.password);
}

function loginStudent(app) {
  return login(app, config.demo.student.email, config.demo.student.password);
}

async function signup(app, { name = 'Test Learner', email, password = 'Password1' }) {
  const agent = request.agent(app);
  const token = await csrf(agent, '/signup');
  const res = await agent.post('/signup').type('form').send({ _csrf: token, name, email, password, confirm: password });
  return { agent, res };
}

module.exports = { request, config, setup, cleanup, csrf, csrfFrom, login, loginAdmin, loginStudent, signup, PNG, tmp };
