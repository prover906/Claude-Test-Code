const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config({ quiet: true });

const ROOT = path.resolve(__dirname, '..');

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function trustProxy(value) {
  if (!value) return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'true') return true;
  return value;
}

const dataDir = path.resolve(ROOT, process.env.DATA_DIR || 'data');
const uploadDir = path.resolve(ROOT, process.env.UPLOAD_DIR || 'uploads');

// Use SESSION_SECRET when provided; otherwise generate one once and keep it in
// the data directory so sessions survive restarts.
function loadSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(dataDir, '.session-secret');
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (existing) return existing;
  } catch {
    // fall through and create one
  }
  const secret = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

module.exports = {
  root: ROOT,
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 3000,
  siteName: process.env.SITE_NAME || 'CodeNest',
  dataDir,
  uploadDir,
  dbPath: path.join(dataDir, 'codenest.db'),
  sessionSecret: loadSessionSecret(),
  trustProxy: trustProxy(process.env.TRUST_PROXY),
  seedDemoData: bool(process.env.SEED_DEMO_DATA, true),
  showDemoCredentials: bool(process.env.SHOW_DEMO_CREDENTIALS, true),
  allowSignup: bool(process.env.ALLOW_SIGNUP, true),
  maxVideoMb: Number(process.env.MAX_VIDEO_MB) || 500,
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  demo: {
    admin: {
      name: 'Demo Admin',
      email: process.env.DEMO_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@123',
    },
    student: {
      name: 'Demo Student',
      email: process.env.DEMO_STUDENT_EMAIL || 'student@example.com',
      password: process.env.DEMO_STUDENT_PASSWORD || 'Student@123',
    },
  },
};
