## CSS selectors and the box model

### Adding CSS

Link a stylesheet from your `<head>`:

```html
<link rel="stylesheet" href="styles.css">
```

### Selectors

```css
p { color: #333; }              /* every <p> */
.card { padding: 16px; }        /* class="card" */
#hero { min-height: 60vh; }     /* id="hero" */
nav a:hover { color: purple; }  /* links in nav, on hover */
```

### The box model

Every element is a box made of **content**, **padding**, **border** and **margin**.

```css
.card {
  width: 300px;
  padding: 20px;
  border: 1px solid #ddd;
  margin: 16px;
}
```

By default `width` only covers the content, so the card above is actually 342px wide. Fix this everywhere with:

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

Now `width` includes padding and border, which is much easier to reason about.
