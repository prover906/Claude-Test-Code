## Responsive design with media queries

A responsive site adapts to any screen size. Design for **mobile first**, then add rules for bigger screens.

```css
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### Responsive images

```css
img {
  max-width: 100%;
  height: auto;
}
```

### Fluid typography

```css
h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}
```

🎉 Congratulations! You now know enough HTML and CSS to build and publish your own portfolio. Try deploying it for free with GitHub Pages.
