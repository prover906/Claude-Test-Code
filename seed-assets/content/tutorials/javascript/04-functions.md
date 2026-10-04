## Declaring functions

```js
function multiply(a, b) {
  return a * b;
}

const divide = function (a, b) {
  return a / b;
};

const subtract = (a, b) => a - b;
```

## Default and rest parameters

```js
function greet(name = "friend") {
  return `Hello, ${name}!`;
}

function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3, 4); // 10
```

## Callbacks

Functions can be passed to other functions:

```js
setTimeout(() => {
  console.log("One second later…");
}, 1000);
```

## Closures

A function remembers the variables from where it was created:

```js
function makeCounter() {
  let count = 0;
  return () => ++count;
}

const next = makeCounter();
next(); // 1
next(); // 2
```
