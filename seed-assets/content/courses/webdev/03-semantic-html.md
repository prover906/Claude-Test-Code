## Semantic HTML

Semantic elements describe the *meaning* of content, not just how it looks. They help search engines, screen readers and other developers.

```html
<header>
  <nav>
    <a href="/">Home</a>
    <a href="/projects">Projects</a>
  </nav>
</header>

<main>
  <article>
    <h1>Building my portfolio</h1>
    <p>Today I learned about semantic HTML…</p>
  </article>
  <aside>Related posts</aside>
</main>

<footer>© 2026 Asha</footer>
```

### Quick reference

- `<header>` / `<footer>` — introductory and closing content
- `<nav>` — major navigation links
- `<main>` — the main content (one per page)
- `<article>` — self-contained content, like a blog post
- `<section>` — a themed group of content with a heading
- `<aside>` — related but secondary content

> Reach for `<div>` only when no semantic element fits.
