const { Marked } = require('marked');
const { markedHighlight } = require('marked-highlight');
const hljs = require('highlight.js');
const sanitizeHtml = require('sanitize-html');

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
  { gfm: true, breaks: false },
);

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'del', 'ins', 'kbd', 'mark', 'sup', 'sub', 'details', 'summary', 'video', 'source']),
  allowedAttributes: {
    a: ['href', 'name', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    video: ['src', 'controls', 'width', 'height', 'poster', 'preload'],
    source: ['src', 'type'],
    code: ['class'],
    pre: ['class'],
    span: ['class'],
    th: ['align'],
    td: ['align'],
    ol: ['start'],
    '*': ['id'],
  },
  allowedClasses: {
    code: [/^hljs/, /^language-/],
    pre: [/^hljs/, /^language-/],
    span: [/^hljs-/],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  allowProtocolRelative: false,
  transformTags: {
    a(tagName, attribs) {
      const href = attribs.href || '';
      if (/^https?:\/\//i.test(href)) {
        return { tagName, attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer' } };
      }
      return { tagName, attribs };
    },
    img(tagName, attribs) {
      return { tagName, attribs: { ...attribs, loading: 'lazy' } };
    },
  },
};

// Markdown -> sanitised HTML. Safe to output unescaped in templates.
function renderMarkdown(source) {
  const html = marked.parse(String(source || ''));
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

// Markdown -> plain text, for excerpts and search snippets.
function markdownToText(source) {
  const html = marked.parse(String(source || ''));
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = { renderMarkdown, markdownToText };
