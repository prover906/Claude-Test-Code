Objects store data as key–value pairs.

```js
const user = {
  name: "Ravi",
  age: 24,
  skills: ["JS", "CSS"],
  greet() {
    return `Hi, I'm ${this.name}`;
  },
};

user.name;          // "Ravi"
user["age"];        // 24
user.city = "Pune"; // add a property
delete user.age;    // remove a property
```

## Looping over objects

```js
for (const [key, value] of Object.entries(user)) {
  console.log(key, value);
}

Object.keys(user);    // ["name", "skills", "greet", "city"]
```

## Destructuring

```js
const { name, city = "Unknown" } = user;
```

## Copying and merging

```js
const copy = { ...user };
const withRole = { ...user, role: "admin" };
```

## JSON

```js
const json = JSON.stringify({ id: 1, done: false }); // '{"id":1,"done":false}'
const data = JSON.parse(json);
```
