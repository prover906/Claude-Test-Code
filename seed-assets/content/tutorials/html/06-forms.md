Forms collect input from users.

```html
<form action="/subscribe" method="post">
  <label for="name">Name</label>
  <input id="name" name="name" type="text" required>

  <label for="email">Email</label>
  <input id="email" name="email" type="email" required>

  <label for="level">Experience</label>
  <select id="level" name="level">
    <option>Beginner</option>
    <option>Intermediate</option>
  </select>

  <label>
    <input type="checkbox" name="newsletter"> Send me the newsletter
  </label>

  <button type="submit">Subscribe</button>
</form>
```

## Useful input types

`text`, `email`, `password`, `number`, `date`, `tel`, `url`, `file`, `range`, `color`

## Built-in validation

```html
<input type="password" minlength="8" required>
<input type="number" min="1" max="10">
```

Always pair inputs with a `<label>` — it makes forms accessible and the click target bigger.
