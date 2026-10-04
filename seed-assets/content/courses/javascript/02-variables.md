## let, const and var

Modern JavaScript has three ways to declare variables.

```js
const name = "Asha";   // can't be reassigned
let score = 0;         // can be reassigned
score = score + 10;
```

### Rule of thumb

1. Use **`const`** by default.
2. Use **`let`** when the value has to change.
3. Avoid **`var`** in new code.

### Why avoid var?

`var` is *function-scoped* and gets hoisted, which leads to surprising bugs:

```js
for (var i = 0; i < 3; i++) {}
console.log(i); // 3  — i leaked out of the loop!

for (let j = 0; j < 3; j++) {}
console.log(j); // ReferenceError: j is not defined
```

`let` and `const` are *block-scoped*: they only exist inside the `{ }` where you declare them.

> `const` stops *reassignment*, not mutation. You can still push to a `const` array.
