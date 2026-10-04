const fs = require('fs');
const path = require('path');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { request, config, setup, cleanup, csrf, login, loginAdmin, signup, PNG } = require('./helpers');

let app;
let admin;

before(async () => {
  app = await setup();
  ({ agent: admin } = await loginAdmin(app));
});

after(cleanup);

function filesIn(folder) {
  return fs.readdirSync(path.join(config.uploadDir, folder));
}

test('admins land on the dashboard', async () => {
  const res = await admin.get('/admin').expect(200);
  assert.match(res.text, /New signups/);
  assert.match(res.text, /Most popular courses/);
});

test('anonymous visitors are redirected away from admin pages', async () => {
  const res = await request(app).get('/admin/courses').expect(302);
  assert.match(res.headers.location, /^\/login/);
});

test('create a course with a cover image, add lessons and publish it', async () => {
  let token = await csrf(admin, '/admin/courses/new');
  const created = await admin
    .post(`/admin/courses?_csrf=${token}`)
    .field('title', 'Rust for Curious Coders')
    .field('summary', 'Memory safety without the garbage collector.')
    .field('description', '## Hello\n\nLearn **Rust**.')
    .field('category', 'Rust')
    .field('level', 'Intermediate')
    .attach('thumbnail', PNG, { filename: 'cover.png', contentType: 'image/png' })
    .expect(302);
  const courseId = created.headers.location.match(/\/admin\/courses\/(\d+)\/edit/)[1];

  const edit = await admin.get(`/admin/courses/${courseId}/edit`).expect(200);
  assert.match(edit.text, /\/uploads\/images\/[\w-]+\.png/);

  // Drafts are hidden from the public until published.
  await request(app).get('/courses/rust-for-curious-coders').expect(404);

  token = await csrf(admin, `/admin/courses/${courseId}/lessons/new`);
  await admin
    .post(`/admin/courses/${courseId}/lessons?_csrf=${token}`)
    .field('title', 'Installing Rust')
    .field('video_type', 'youtube')
    .field('youtube_url', 'https://youtu.be/abcdefghijk?t=10')
    .field('is_preview', 'on')
    .field('content', 'Run `rustup`.')
    .expect(302);

  const badLink = await admin
    .post(`/admin/courses/${courseId}/lessons?_csrf=${token}`)
    .field('title', 'Broken')
    .field('video_type', 'youtube')
    .field('youtube_url', 'https://example.com/video');
  assert.equal(badLink.status, 422);
  assert.match(badLink.text, /Paste a YouTube link/);

  const uploaded = await admin
    .post(`/admin/courses/${courseId}/lessons?_csrf=${token}`)
    .field('title', 'Ownership')
    .field('video_type', 'upload')
    .attach('video', Buffer.from('fake video bytes'), { filename: 'ownership.mp4', contentType: 'video/mp4' })
    .attach('resource', Buffer.from('Rar!'), { filename: 'starter-code.rar', contentType: 'application/octet-stream' })
    .expect(302);
  assert.match(uploaded.headers.location, /#lessons$/);

  token = await csrf(admin, '/admin/courses');
  await admin.post(`/admin/courses/${courseId}/toggle`).type('form').send({ _csrf: token }).expect(302);

  const page = await request(app).get('/courses/rust-for-curious-coders').expect(200);
  assert.match(page.text, /Installing Rust/);
  assert.match(page.text, /Ownership/);

  // Admins get links to every lesson (visitors only see the preview link).
  const adminPage = await admin.get('/courses/rust-for-curious-coders').expect(200);
  const lessons = [...adminPage.text.matchAll(/\/courses\/rust-for-curious-coders\/lessons\/(\d+)"/g)].map((m) => m[1]);
  const preview = await request(app).get(`/courses/rust-for-curious-coders/lessons/${lessons[0]}`).expect(200);
  assert.match(preview.text, /youtube-nocookie\.com\/embed\/abcdefghijk/);

  // The admin can stream the uploaded video.
  const video = await admin.get(`/courses/rust-for-curious-coders/lessons/${lessons[1]}/video`).expect(200);
  assert.equal(video.headers['content-type'], 'video/mp4');

  const resource = await admin.get(`/courses/rust-for-curious-coders/lessons/${lessons[1]}/resource`).expect(200);
  assert.match(resource.headers['content-disposition'], /attachment; filename="starter-code\.rar"/);
});

test('uploads with the wrong file type are rejected and not kept', async () => {
  const before = filesIn('images').length;
  const token = await csrf(admin, '/admin/courses/new');
  const res = await admin
    .post(`/admin/courses?_csrf=${token}`)
    .field('title', 'Bad upload')
    .field('summary', 'x')
    .attach('thumbnail', Buffer.from('<script>alert(1)</script>'), { filename: 'x.html', contentType: 'text/html' });
  assert.equal(res.status, 422);
  assert.match(res.text, /is not supported/);
  assert.equal(filesIn('images').length, before);
});

test('upload forms posted with XHR get a JSON redirect', async () => {
  const token = await csrf(admin, '/admin/courses/new');
  const res = await admin
    .post(`/admin/courses?_csrf=${token}`)
    .set('X-Upload-Request', '1')
    .field('title', 'Go in Practice')
    .field('summary', 'Concurrency made simple.')
    .attach('thumbnail', PNG, { filename: 'go.png', contentType: 'image/png' })
    .expect(200);
  assert.match(res.body.redirect, /^\/admin\/courses\/\d+\/edit/);
});

test('deleting a course removes its uploaded files', async () => {
  let token = await csrf(admin, '/admin/courses/new');
  const created = await admin
    .post(`/admin/courses?_csrf=${token}`)
    .field('title', 'Temporary course')
    .field('summary', 'Will be deleted')
    .attach('thumbnail', PNG, { filename: 't.png', contentType: 'image/png' })
    .expect(302);
  const courseId = created.headers.location.match(/\/admin\/courses\/(\d+)\//)[1];
  token = await csrf(admin, `/admin/courses/${courseId}/lessons/new`);
  await admin
    .post(`/admin/courses/${courseId}/lessons?_csrf=${token}`)
    .field('title', 'Clip')
    .field('video_type', 'upload')
    .attach('video', Buffer.from('bytes'), { filename: 'clip.webm', contentType: 'video/webm' })
    .expect(302);

  const imagesBefore = filesIn('images').length;
  const videosBefore = filesIn('videos').length;
  token = await csrf(admin, '/admin/courses');
  await admin.post(`/admin/courses/${courseId}/delete`).type('form').send({ _csrf: token }).expect(302);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(filesIn('images').length, imagesBefore - 1);
  assert.equal(filesIn('videos').length, videosBefore - 1);
  assert.ok(filesIn('videos').includes('sample-lesson.mp4'), 'shared sample video is kept');
});

test('lessons can be reordered', async () => {
  const token = await csrf(admin, '/admin/courses/1/edit');
  await admin.post('/admin/courses/1/lessons/2/move').type('form').send({ _csrf: token, direction: 'up' }).expect(302);
  const page = await request(app).get('/courses/python-for-absolute-beginners').expect(200);
  assert.ok(page.text.indexOf('Variables and data types') < page.text.indexOf('Introduction &amp; setting up Python'));
  await admin.post('/admin/courses/1/lessons/2/move').type('form').send({ _csrf: token, direction: 'down' }).expect(302);
});

test('create a tutorial with chapters; Markdown is sanitised', async () => {
  let token = await csrf(admin, '/admin/tutorials/new');
  const created = await admin
    .post('/admin/tutorials')
    .type('form')
    .send({ _csrf: token, title: 'SQL Tutorial', description: 'Query data like a pro.', category: 'Databases', badge: 'SQL', is_published: 'on' })
    .expect(302);
  const tutorialId = created.headers.location.match(/\/admin\/tutorials\/(\d+)\//)[1];

  token = await csrf(admin, `/admin/tutorials/${tutorialId}/chapters/new`);
  await admin
    .post(`/admin/tutorials/${tutorialId}/chapters`)
    .type('form')
    .send({
      _csrf: token,
      title: 'SELECT basics',
      content: '```sql\nSELECT * FROM users;\n```\n\n<script>alert("x")</script>\n\n[bad](javascript:alert(1))',
    })
    .expect(302);

  const chapter = await request(app).get('/tutorials/sql-tutorial/select-basics').expect(200);
  assert.match(chapter.text, /hljs-keyword">SELECT/);
  assert.doesNotMatch(chapter.text, /alert\("x"\)/);
  assert.doesNotMatch(chapter.text, /javascript:alert/);
});

test('markdown preview endpoint returns sanitised HTML', async () => {
  const token = await csrf(admin, '/admin');
  const res = await admin
    .post('/admin/preview')
    .set('X-CSRF-Token', token)
    .send({ markdown: '**bold** <img src=x onerror=alert(1)>' })
    .expect(200);
  assert.match(res.body.html, /<strong>bold<\/strong>/);
  assert.doesNotMatch(res.body.html, /onerror/);
});

test('admins can create users, change roles and ban accounts', async () => {
  let token = await csrf(admin, '/admin/users/new');
  const created = await admin
    .post('/admin/users')
    .type('form')
    .send({ _csrf: token, name: 'Ravi Kumar', email: 'ravi@example.com', role: 'student', password: 'Welcome123' })
    .expect(302);
  const userId = created.headers.location.match(/\/admin\/users\/(\d+)/)[1];

  const { agent: ravi } = await login(app, 'ravi@example.com', 'Welcome123');
  await ravi.get('/dashboard').expect(200);
  await ravi.get('/admin').expect(403);

  token = await csrf(admin, `/admin/users/${userId}`);
  await admin
    .post(`/admin/users/${userId}`)
    .type('form')
    .send({ _csrf: token, name: 'Ravi Kumar', email: 'ravi@example.com', role: 'admin', status: 'active', bio: '' })
    .expect(302);
  await ravi.get('/admin').expect(200);

  await admin
    .post(`/admin/users/${userId}`)
    .type('form')
    .send({ _csrf: token, name: 'Ravi Kumar', email: 'ravi@example.com', role: 'student', status: 'banned', bio: '' })
    .expect(302);
  // Banning signs the user out immediately and blocks new sign-ins.
  await ravi.get('/dashboard').expect(302);
  const again = await login(app, 'ravi@example.com', 'Welcome123');
  assert.equal(again.res.status, 403);
  assert.match(again.res.text, /suspended/);
});

test('admins can reset a password and delete a user', async () => {
  const { res } = await signup(app, { email: 'tobedeleted@example.com' });
  assert.equal(res.status, 302);
  const list = await admin.get('/admin/users?q=tobedeleted').expect(200);
  const userId = list.text.match(/\/admin\/users\/(\d+)"/)[1];

  const token = await csrf(admin, `/admin/users/${userId}`);
  await admin.post(`/admin/users/${userId}/password`).type('form').send({ _csrf: token, password: 'Reset12345' }).expect(302);
  const relogin = await login(app, 'tobedeleted@example.com', 'Reset12345');
  assert.equal(relogin.res.status, 302);

  await admin.post(`/admin/users/${userId}/delete`).type('form').send({ _csrf: token }).expect(302);
  await admin.get(`/admin/users/${userId}`).expect(404);
});

test('admins cannot lock themselves out', async () => {
  const token = await csrf(admin, '/admin/users/1');
  const demote = await admin
    .post('/admin/users/1')
    .type('form')
    .send({ _csrf: token, name: 'Demo Admin', email: 'admin@example.com', role: 'student', status: 'banned', bio: '' });
  assert.equal(demote.status, 422);
  assert.match(demote.text, /own admin access/);

  const del = await admin.post('/admin/users/1/delete').type('form').send({ _csrf: token }).expect(302);
  assert.equal(del.headers.location, '/admin/users/1');
  await admin.get('/admin').expect(200);
});

test('media library uploads and deletes files', async () => {
  let token = await csrf(admin, '/admin/media');
  await admin
    .post(`/admin/media?_csrf=${token}`)
    .attach('file', PNG, { filename: 'diagram.png', contentType: 'image/png' })
    .expect(302);
  const page = await admin.get('/admin/media').expect(200);
  const url = page.text.match(/data-copy="(\/uploads\/media\/[^"]+)"/)[1];
  await request(app).get(url).expect(200);

  const id = page.text.match(/\/admin\/media\/(\d+)\/delete/)[1];
  token = await csrf(admin, '/admin/media');
  await admin.post(`/admin/media/${id}/delete`).type('form').send({ _csrf: token }).expect(302);
  await new Promise((resolve) => setTimeout(resolve, 50));
  await request(app).get(url).expect(404);
});
