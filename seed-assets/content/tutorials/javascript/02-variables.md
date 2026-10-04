Declare variables with `const` or `let`.

```js
const siteName = "CodeNest";   // cannot be reassigned
let visitors = 0;              // can change
visitors += 1;
```

## Naming

- Use `camelCase`: `totalPrice`, `isLoggedIn`.
- Names are case-sensitive.
- Can't start with a digit or use reserved words like `class`.

## Scope

```js
const greeting = "hi";      // global

function sayHi() {
  const name = "Asha";      // function scope
  if (true) {
    let mood = "happy";     // block scope
  }
  // mood is not available here
}
```

## Template literals

Backticks let you embed expressions:

```js
const item = "book";
const price = 299;
console.log(`The ${item} costs ₹${price}.`);
```
