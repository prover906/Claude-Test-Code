## How JavaScript runs

JavaScript was created to make web pages interactive. Today it runs in two main places:

- **The browser** — every browser has a JavaScript engine (V8 in Chrome, SpiderMonkey in Firefox).
- **The server** — [Node.js](https://nodejs.org/) lets you run the same language outside the browser.

### Your first script

Open any page, press <kbd>F12</kbd> to open DevTools, go to the **Console** tab and type:

```js
console.log("Hello from JavaScript!");
```

To add JavaScript to your own page, use a `<script>` tag just before `</body>`:

```html
<script src="app.js"></script>
```

### Single-threaded, but not blocking

JavaScript runs one thing at a time on a single thread. Slow work like network requests is handed off, and the result comes back later through the **event loop**. You'll see this in action in the async lesson.
