JavaScript has seven primitive types plus objects.

| Type | Example |
| --- | --- |
| `string` | `"hello"` |
| `number` | `42`, `3.14` |
| `bigint` | `9007199254740993n` |
| `boolean` | `true`, `false` |
| `undefined` | a declared variable with no value |
| `null` | an intentional "no value" |
| `symbol` | `Symbol("id")` |
| `object` | `{}`, `[]`, functions |

## Checking types

```js
typeof "hi";        // "string"
typeof 42;          // "number"
typeof undefined;   // "undefined"
typeof null;        // "object"  (a famous quirk!)
Array.isArray([]);  // true
```

## Equality

Always prefer **strict** equality:

```js
0 == "0";    // true  (type coercion)
0 === "0";   // false (different types)
```

## Truthy and falsy

These values are *falsy*: `false`, `0`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy.

```js
const name = "";
const displayName = name || "Guest";   // "Guest"
const count = 0;
const shown = count ?? 10;             // 0 (only null/undefined fall back)
```
