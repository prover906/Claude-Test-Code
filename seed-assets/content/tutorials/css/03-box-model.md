Every element is a rectangular box with four layers:

```text
┌──────────── margin ────────────┐
│ ┌────────── border ──────────┐ │
│ │ ┌──────── padding ───────┐ │ │
│ │ │        content         │ │ │
│ │ └────────────────────────┘ │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

```css
.card {
  width: 320px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin: 16px auto;   /* auto centres horizontally */
}
```

## box-sizing

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

With `border-box`, `width` includes padding and border, so `.card` above is exactly 320px wide.

## Shorthand

```css
margin: 10px;               /* all sides */
margin: 10px 20px;          /* vertical | horizontal */
margin: 10px 20px 30px 40px;/* top | right | bottom | left */
```
