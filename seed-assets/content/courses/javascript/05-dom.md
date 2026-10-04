## Working with the DOM

The **DOM** (Document Object Model) is the browser's live representation of your HTML. JavaScript can read and change it.

### Selecting elements

```js
const title = document.querySelector("h1");
const buttons = document.querySelectorAll(".btn");
```

### Changing content and styles

```js
title.textContent = "Hello, DOM!";
title.classList.add("highlight");
```

### Responding to events

```html
<button id="like">👍 Like</button>
<span id="count">0</span>
```

```js
const button = document.querySelector("#like");
const count = document.querySelector("#count");
let likes = 0;

button.addEventListener("click", () => {
  likes++;
  count.textContent = likes;
});
```

### Creating elements

```js
const item = document.createElement("li");
item.textContent = "New task";
document.querySelector("ul").append(item);
```

> Prefer `textContent` over `innerHTML` when inserting user input. It prevents script injection.
