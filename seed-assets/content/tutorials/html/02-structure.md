Every HTML document follows the same skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page title</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Visible content goes here -->
</body>
</html>
```

| Part | Purpose |
| --- | --- |
| `<!DOCTYPE html>` | Use standards mode |
| `<html lang="en">` | Root element and page language |
| `<head>` | Metadata, title, styles |
| `<body>` | Everything the user sees |

## Comments

```html
<!-- This won't appear on the page -->
```

## Nesting

Elements must be closed in the reverse order they were opened:

```html
<p>This is <strong>correct</strong>.</p>
<p>This is <strong>wrong</p></strong>
```
