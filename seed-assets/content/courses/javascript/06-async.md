## Promises and async/await

Some operations take time: fetching data, reading files, waiting for a timer. JavaScript handles them **asynchronously**.

### Promises

A promise represents a value that will be available later:

```js
fetch("https://api.github.com/users/octocat")
  .then(response => response.json())
  .then(user => console.log(user.name))
  .catch(error => console.error("Request failed", error));
```

### async/await

`async/await` lets you write the same thing as if it were synchronous:

```js
async function showUser(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const user = await response.json();
    console.log(user.name);
  } catch (error) {
    console.error("Request failed", error);
  }
}

showUser("octocat");
```

### Running things in parallel

```js
const [a, b] = await Promise.all([fetch("/api/a"), fetch("/api/b")]);
```

🎉 You've finished the bootcamp. Build something small, like a weather widget, to lock in what you've learned.
