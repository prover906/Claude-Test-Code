The DOM lets JavaScript read and change the page.

## Selecting elements

```js
document.getElementById("main");
document.querySelector(".card");       // first match
document.querySelectorAll("li");       // all matches
```

## Changing elements

```js
const heading = document.querySelector("h1");
heading.textContent = "New title";
heading.style.color = "rebeccapurple";
heading.classList.toggle("active");
heading.setAttribute("title", "Tooltip");
```

## Events

```js
const form = document.querySelector("form");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = form.elements.email.value;
  console.log("Subscribed:", email);
});
```

## A tiny to-do list

```html
<input id="task" placeholder="New task">
<button id="add">Add</button>
<ul id="list"></ul>
```

```js
document.querySelector("#add").addEventListener("click", () => {
  const input = document.querySelector("#task");
  if (!input.value.trim()) return;
  const li = document.createElement("li");
  li.textContent = input.value;
  document.querySelector("#list").append(li);
  input.value = "";
});
```
