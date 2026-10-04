## Flexbox layouts

Flexbox arranges items in a row or a column and makes alignment easy.

```css
.navbar {
  display: flex;
  justify-content: space-between; /* main axis */
  align-items: center;            /* cross axis */
  gap: 16px;
}
```

### Common patterns

**Centre anything:**

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
```

**Wrapping cards:**

```css
.cards {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.cards > * {
  flex: 1 1 280px; /* grow, shrink, start at 280px */
}
```

### Cheat sheet

| Property | Values |
| --- | --- |
| `flex-direction` | `row`, `column` |
| `justify-content` | `flex-start`, `center`, `space-between`, `space-around` |
| `align-items` | `stretch`, `center`, `flex-start`, `flex-end` |
| `flex-wrap` | `nowrap`, `wrap` |
