JavaScript (JS) is the programming language of the web. Together with HTML and CSS, it is one of the three core technologies every website is built with.

## What can JavaScript do?

- Update page content without reloading
- Validate forms before they are submitted
- Build full web apps with React, Vue or Svelte
- Run servers and command-line tools with Node.js
- Build mobile and desktop apps (React Native, Electron)

## Try it right now

Open your browser's DevTools (<kbd>F12</kbd>), switch to the **Console** tab and type:

```js
alert("Hello from JavaScript!");
```

## Adding JavaScript to a page

```html
<!DOCTYPE html>
<html>
  <body>
    <h1 id="title">Hello</h1>
    <script src="app.js"></script>
  </body>
</html>
```

```js
// app.js
document.getElementById("title").textContent = "Hello, JavaScript!";
```
