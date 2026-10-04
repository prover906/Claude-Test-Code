const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { request, setup, cleanup, csrf, login, loginStudent, signup } = require('./helpers');

let app;

before(async () => {
  app = await setup();
});

after(cleanup);

test('home page lists the seeded courses and tutorials', async () => {
  const res = await request(app).get('/').expect(200);
  assert.match(res.text, /Python for Absolute Beginners/);
  assert.match(res.text, /JavaScript Tutorial/);
  assert.doesNotMatch(res.text, /React for Beginners/, 'draft course must not be listed');
});

test('draft content is hidden from the public', async () => {
  await request(app).get('/courses/react-for-beginners').expect(404);
  await request(app).get('/tutorials/git').expect(404);
});

test('course filters and search work', async () => {
  const filtered = await request(app).get('/courses?category=Python').expect(200);
  assert.match(filtered.text, /Python for Absolute Beginners/);
  assert.doesNotMatch(filtered.text, /Modern JavaScript Bootcamp/);

  const search = await request(app).get('/search?q=flexbox').expect(200);
  assert.match(search.text, /Flexbox/);
});

test('tutorials redirect to their first chapter and render highlighted code', async () => {
  const res = await request(app).get('/tutorials/python').expect(302);
  assert.equal(res.headers.location, '/tutorials/python/introduction-to-python');
  const chapter = await request(app).get('/tutorials/python/your-first-python-program').expect(200);
  assert.match(chapter.text, /class="hljs language-python"/);
});

test('security headers are set', async () => {
  const res = await request(app).get('/').expect(200);
  assert.match(res.headers['content-security-policy'], /script-src 'self' 'nonce-/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

test('forms without a CSRF token are rejected', async () => {
  await request(app).post('/login').type('form').send({ email: 'a@b.co', password: 'x' }).expect(403);
});

test('anyone can sign up, then reach their dashboard', async () => {
  const { agent, res } = await signup(app, { email: 'new.learner@example.com' });
  assert.equal(res.status, 302);
  const dashboard = await agent.get('/dashboard').expect(200);
  assert.match(dashboard.text, /Hi, Test/);
});

test('signup validates input', async () => {
  const dup = await signup(app, { email: 'student@example.com' });
  assert.equal(dup.res.status, 422);
  assert.match(dup.res.text, /already exists/);

  const weak = await signup(app, { email: 'weak@example.com', password: 'short' });
  assert.equal(weak.res.status, 422);
  assert.match(weak.res.text, /at least 8 characters/);
});

test('login rejects a wrong password', async () => {
  const { res } = await login(app, 'student@example.com', 'wrong-password1');
  assert.equal(res.status, 401);
  assert.match(res.text, /Incorrect email or password/);
});

test('login only redirects to local paths', async () => {
  const agent = request.agent(app);
  const token = await csrf(agent, '/login');
  const res = await agent
    .post('/login')
    .type('form')
    .send({ _csrf: token, email: 'student@example.com', password: 'Student@123', next: 'https://evil.example/' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.location, '/dashboard');
});

test('signed-out visitors are sent to the login page', async () => {
  const res = await request(app).get('/dashboard').expect(302);
  assert.match(res.headers.location, /^\/login\?next=/);
});

test('free preview lessons are public, other lessons need enrollment', async () => {
  const course = '/courses/python-for-absolute-beginners';
  await request(app).get(`${course}/lessons/1`).expect(200);
  await request(app).get(`${course}/lessons/1/video`).set('Range', 'bytes=0-99').expect(206);

  const locked = await request(app).get(`${course}/lessons/2`).expect(302);
  assert.match(locked.headers.location, /^\/login/);
  await request(app).get(`${course}/lessons/2/video`).expect(403);
  // Private upload folders are never served directly.
  await request(app).get('/uploads/videos/sample-lesson.mp4').expect(404);
});

test('enrolling unlocks lessons and progress is tracked', async () => {
  const { agent } = await signup(app, { email: 'enroll@example.com' });
  const course = '/courses/modern-javascript-bootcamp';

  const before = await agent.get(`${course}/lessons/12`);
  assert.equal(before.status, 302, 'not enrolled yet');

  let token = await csrf(agent, course);
  const enroll = await agent.post(`${course}/enroll`).type('form').send({ _csrf: token }).expect(302);
  assert.match(enroll.headers.location, new RegExp(`^${course}/lessons/\\d+$`));

  const lessonUrl = enroll.headers.location;
  await agent.get(lessonUrl).expect(200);
  token = await csrf(agent, lessonUrl);
  const done = await agent.post(`${lessonUrl}/complete`).type('form').send({ _csrf: token, complete: '1' }).expect(302);
  assert.notEqual(done.headers.location, lessonUrl, 'moves on to the next lesson');

  const dashboard = await agent.get('/dashboard').expect(200);
  assert.match(dashboard.text, /1 \/ 6 lessons/);
});

test('enrolled students can download lesson resources', async () => {
  const { agent } = await loginStudent(app);
  const res = await agent.get('/courses/python-for-absolute-beginners/lessons/8/resource').expect(200);
  assert.match(res.headers['content-disposition'], /number-guessing-game\.zip/);
  const anon = await request(app).get('/courses/python-for-absolute-beginners/lessons/8/resource');
  assert.equal(anon.status, 302);
});

test('students cannot open the admin dashboard', async () => {
  const { agent } = await loginStudent(app);
  await agent.get('/admin').expect(403);
  await agent.get('/admin/users').expect(403);
});

test('users can update their profile and password', async () => {
  const { agent } = await signup(app, { email: 'profile@example.com' });
  let token = await csrf(agent, '/account');
  await agent.post(`/account?_csrf=${token}`).field('name', 'Renamed Learner').field('bio', 'Hello').expect(302);
  const page = await agent.get('/account').expect(200);
  assert.match(page.text, /Renamed Learner/);

  token = await csrf(agent, '/account');
  const wrong = await agent
    .post('/account/password')
    .type('form')
    .send({ _csrf: token, current_password: 'nope', password: 'NewPassword2', confirm: 'NewPassword2' });
  assert.equal(wrong.status, 422);

  await agent
    .post('/account/password')
    .type('form')
    .send({ _csrf: token, current_password: 'Password1', password: 'NewPassword2', confirm: 'NewPassword2' })
    .expect(302);
  const relogin = await login(app, 'profile@example.com', 'NewPassword2');
  assert.equal(relogin.res.status, 302);
});

test('logout ends the session', async () => {
  const { agent } = await loginStudent(app);
  const token = await csrf(agent, '/dashboard');
  await agent.post('/logout').type('form').send({ _csrf: token }).expect(302);
  await agent.get('/dashboard').expect(302);
});
