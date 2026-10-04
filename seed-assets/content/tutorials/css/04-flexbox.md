Flexbox lays out items along one axis.

```css
.container {
  display: flex;
  flex-direction: row;          /* or column */
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
```

## Flex items

```css
.sidebar { flex: 0 0 240px; }  /* don't grow, don't shrink, 240px */
.content { flex: 1; }          /* take the remaining space */
```

## Perfect centring

```css
.hero {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
```

## Push one item to the end

```css
.nav { display: flex; gap: 1rem; }
.nav .login { margin-left: auto; }
```
