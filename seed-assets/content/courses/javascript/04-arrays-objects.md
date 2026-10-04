## Arrays and objects

### Arrays

```js
const languages = ["HTML", "CSS", "JavaScript"];
languages.push("React");
console.log(languages.length); // 4
```

The most useful array methods take a function:

```js
const prices = [120, 450, 80, 999];

const withTax = prices.map(p => p * 1.18);
const cheap = prices.filter(p => p < 200);
const total = prices.reduce((sum, p) => sum + p, 0);
const hasExpensive = prices.some(p => p > 900);
```

### Objects

Objects group related data with named keys:

```js
const course = {
  title: "Modern JavaScript",
  lessons: 6,
  free: true,
};

console.log(course.title);
course.lessons += 1;
```

### Destructuring and spread

```js
const { title, lessons } = course;
const updated = { ...course, free: false };
const all = [...languages, "Node.js"];
```
