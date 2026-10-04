```js
const fruits = ["apple", "mango", "banana"];
fruits.push("grape");      // add to end
fruits.unshift("kiwi");    // add to start
fruits.pop();              // remove from end
fruits.includes("mango");  // true
fruits.indexOf("banana");  // 3
```

## Looping

```js
for (const fruit of fruits) {
  console.log(fruit);
}

fruits.forEach((fruit, index) => console.log(index, fruit));
```

## Transforming arrays

```js
const numbers = [1, 2, 3, 4, 5];

numbers.map(n => n * 2);           // [2, 4, 6, 8, 10]
numbers.filter(n => n % 2 === 0);  // [2, 4]
numbers.find(n => n > 3);          // 4
numbers.reduce((a, b) => a + b);   // 15
```

## Sorting numbers correctly

```js
const scores = [100, 25, 3];
scores.sort();                  // [100, 25, 3]  ❌ sorts as strings
scores.sort((a, b) => a - b);   // [3, 25, 100]  ✅
```
