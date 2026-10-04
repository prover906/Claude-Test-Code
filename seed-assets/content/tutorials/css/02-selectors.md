```css
/* Element */
p { margin-bottom: 1rem; }

/* Class */
.btn { padding: 8px 16px; }

/* ID */
#header { position: sticky; top: 0; }

/* Descendant */
nav a { text-decoration: none; }

/* Child */
ul > li { list-style: square; }

/* Attribute */
input[type="email"] { border-color: teal; }

/* Grouping */
h1, h2, h3 { font-family: system-ui, sans-serif; }
```

## Pseudo-classes

```css
a:hover { color: #7c3aed; }
button:focus-visible { outline: 2px solid #7c3aed; }
li:first-child { font-weight: bold; }
tr:nth-child(even) { background: #f5f5f5; }
input:invalid { border-color: crimson; }
```

## Pseudo-elements

```css
.required::after { content: " *"; color: crimson; }
p::first-line { font-weight: 600; }
```

## Specificity, roughly

inline styles > IDs > classes / attributes / pseudo-classes > elements
