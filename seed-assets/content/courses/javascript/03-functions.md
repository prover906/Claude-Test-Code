## Functions and arrow functions

### Function declarations

```js
function add(a, b) {
  return a + b;
}
```

### Arrow functions

A shorter syntax that is great for small callbacks:

```js
const add = (a, b) => a + b;
const square = n => n * n;
const greet = () => console.log("Hi!");
```

If the body needs more than one line, use braces and `return`:

```js
const describe = (name, age) => {
  const label = age >= 18 ? "adult" : "minor";
  return `${name} is an ${label}`;
};
```

### Default parameters

```js
function greet(name = "friend") {
  return `Hello, ${name}!`;
}
greet();        // "Hello, friend!"
greet("Ravi");  // "Hello, Ravi!"
```

### Functions are values

You can pass functions to other functions. This is how array methods like `map` and `filter` work, which we cover next.
