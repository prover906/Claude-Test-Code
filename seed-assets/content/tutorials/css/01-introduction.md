**CSS** (Cascading Style Sheets) controls how HTML looks: colours, fonts, spacing and layout.

## A CSS rule

```css
h1 {
  color: #7c3aed;
  font-size: 2.5rem;
}
```

- `h1` is the **selector** — which elements to style.
- `color` and `font-size` are **properties**.
- `#7c3aed` and `2.5rem` are **values**.

## Three ways to add CSS

```html
<!-- 1. External stylesheet (recommended) -->
<link rel="stylesheet" href="styles.css">

<!-- 2. Internal style block -->
<style>
  p { line-height: 1.6; }
</style>

<!-- 3. Inline style (avoid) -->
<p style="color: red;">Warning</p>
```

## The cascade

When several rules target the same element, the browser picks the one with the highest **specificity**; if they tie, the **last** one wins.
