# CodeNest

A learning platform in the style of CodeWithHarry. It has video courses, written tutorials, learner accounts and an admin dashboard where you upload courses and tutorials and manage users.

Built with Node.js, Express, SQLite and server-rendered EJS views. There is no front-end build step, and the database is a single file.

## Quick start

You need **Node.js 20 or newer**.

```bash
npm install
npm start
```

Open <http://localhost:3000>. On first start the app creates the database, the demo accounts and some sample content.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@example.com` | `Admin@123` |
| Student | `student@example.com` | `Student@123` |

The login page shows both accounts; click one to sign in instantly. The admin dashboard is at <http://localhost:3000/admin>.

> Before you put the site on the internet, change these passwords (or delete the demo student) and set `SHOW_DEMO_CREDENTIALS=false`. See [Going live](#going-live).

## Features

### Public website
- **Home page** with featured courses, tutorials and site stats
- **Course catalogue** with search and category and level filters
- **Course pages** with a description, curriculum, an enroll button and progress
- **Lesson player** for YouTube videos or uploaded videos, with Markdown notes, downloadable resources, a playlist sidebar and prev/next navigation
- **Free preview lessons** that anyone can watch; the other lessons unlock when a learner enrolls (enrolling is free)
- **Tutorials**: chapter-by-chapter written guides with syntax-highlighted, copyable code blocks
- **Search** across courses, tutorials and tutorial chapters
- **Dark and light themes**, and responsive down to phone width

### Accounts (anyone can sign up)
- Sign up, sign in and sign out
- **My learning** dashboard showing enrolled courses, progress bars and a "continue where you left off" link
- Account settings: name, bio, profile picture and password change

### Admin dashboard (`/admin`)
- **Overview**: user, course, lesson, tutorial and enrollment counts, a 14-day signup chart, newest users and the most popular courses
- **Courses**: create, edit, publish/unpublish, feature on the home page, upload a cover image, delete
- **Lessons**: add a YouTube link, upload a video file (with a progress bar), or write a reading-only lesson. Attach a downloadable resource (ZIP, PDF and so on), mark lessons as free previews, and reorder them
- **Tutorials and chapters**: Markdown editor with a formatting toolbar and live preview, publish/unpublish, reorder chapters
- **Users**: search and filter, add users, change a role (student or admin), ban or unban, reset a password, delete, and see each user's enrollments and progress
- **Media library**: upload images or files and copy their link (or a Markdown snippet) into lessons and tutorials

### Security
- Passwords are hashed with bcrypt, sessions are stored in SQLite, and the session is regenerated on sign-in
- CSRF tokens on every form, Helmet security headers and a strict Content Security Policy
- Rate limiting on sign-in and sign-up
- Markdown is sanitised before rendering, so `<script>` tags and `javascript:` links are stripped
- Uploaded videos and resources are streamed only to people allowed to watch the lesson; they are never served as public files
- Upload type and size checks; rejected files are deleted
- Banning or deleting a user signs them out everywhere. Admins can't remove their own access or the last admin

## Try it out: a 5-minute tour

1. **Sign in as admin** (`admin@example.com` / `Admin@123`). You land on the dashboard.
2. **Upload a course**: Courses → *New course*. Add a title, summary and cover image, then *Create course*.
3. **Add lessons**: on the course page, click *Add lesson*:
   - choose **YouTube** and paste any YouTube link, or
   - choose **Upload** and pick an MP4/WebM file (the bundled `seed-assets/sample-lesson.mp4` works), and
   - tick **Free preview** if anyone should be able to watch it.
4. Turn on **Published** and save. The course now appears on the website.
5. **Write a tutorial**: Tutorials → *New tutorial*, then *Add chapter*. Use the toolbar and the **Preview** tab.
6. **Manage users**: Users → open *Demo Student* → change the role, ban them or reset the password.
7. **Sign up as a new learner** in a private window, enroll in your course, and mark lessons complete.

## Configuration

Every setting is optional. Copy `.env.example` to `.env` and edit it:

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `3000` | Port to listen on |
| `SITE_NAME` | `CodeNest` | Brand name shown across the site |
| `SESSION_SECRET` | generated | Secret that signs session cookies. If unset, one is generated and saved to `data/.session-secret` |
| `DATA_DIR` / `UPLOAD_DIR` | `data` / `uploads` | Where the SQLite database and uploaded files live |
| `SEED_DEMO_DATA` | `true` | Create the sample courses, tutorials and demo student on first start |
| `SHOW_DEMO_CREDENTIALS` | `true` | Show the demo accounts on the login page |
| `ALLOW_SIGNUP` | `true` | Let anyone create an account |
| `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD` | `admin@example.com` / `Admin@123` | First admin account (used only when the database is empty) |
| `DEMO_STUDENT_EMAIL` / `DEMO_STUDENT_PASSWORD` | `student@example.com` / `Student@123` | Demo student account |
| `MAX_VIDEO_MB` | `500` | Largest video upload, in MB |
| `AUTH_RATE_LIMIT` | `20` | Sign-in and sign-up attempts per IP per 15 minutes |
| `TRUST_PROXY` | unset | Set to `1` behind a reverse proxy (nginx, Render, Railway…) |

### Start over

```bash
npm run reset           # asks for confirmation
npm run reset -- --yes  # no prompt
```

This deletes the database and every uploaded file, then recreates the demo accounts and content.

## Running the tests

```bash
npm test
```

The 30 integration tests cover sign-up and sign-in, CSRF, access control, enrollment and progress, video and resource protection, course, lesson, tutorial and user management, uploads, and Markdown sanitisation. Each test file runs against its own temporary database.

## Project structure

```
src/
  server.js            entry point (seeds on first run, starts the server)
  app.js               Express app: security headers, sessions, routes
  config.js            settings from environment variables
  db/                  schema, connection, demo seed data, reset script
  models/              database queries (users, courses, tutorials, media)
  routes/              public site, auth, learner dashboard, admin/*
  middleware/          auth guards, CSRF, flash messages
  lib/                 markdown, uploads, files, YouTube parsing, helpers
  views/               EJS templates (pages, admin, partials)
public/                CSS, browser JS, images
seed-assets/           sample video, resource zip and Markdown for the demo content
tests/                 integration tests (node:test + supertest)
```

## Going live

1. Set a strong `SESSION_SECRET`, set `SHOW_DEMO_CREDENTIALS=false`, and set `SEED_DEMO_DATA=false` if you don't want the sample content.
2. Sign in as the admin, change the password under **Account settings** (or create your own admin and delete the demo one), and delete the demo student.
3. Serve the site over HTTPS. If it sits behind a proxy, set `TRUST_PROXY=1` so secure cookies and rate limiting work.
4. Keep `data/` and `uploads/` on persistent storage and back them up.

### Docker

```bash
docker build -t codenest .
docker run -p 3000:3000 -v codenest-data:/app/data -v codenest-uploads:/app/uploads codenest
```
