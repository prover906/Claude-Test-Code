CSS Grid lays out items in two dimensions: rows **and** columns.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

## Responsive without media queries

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}
```

Cards fill as many 260px+ columns as fit and wrap automatically.

## Named areas

```css
.page {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
}
header  { grid-area: header; }
aside   { grid-area: sidebar; }
main    { grid-area: main; }
footer  { grid-area: footer; }
```

**Flexbox or Grid?** Use Flexbox for a row or column of things; use Grid when you care about rows and columns at the same time.
