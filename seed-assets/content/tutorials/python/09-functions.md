Functions group code into reusable, named blocks.

```python
def area_of_circle(radius):
    """Return the area of a circle."""
    return 3.14159 * radius ** 2

print(area_of_circle(5))
```

## Parameters

```python
def introduce(name, city="Delhi", *hobbies, **details):
    print(f"{name} from {city}")
    print("Hobbies:", hobbies)
    print("Details:", details)

introduce("Asha", "Pune", "chess", "coding", age=21)
```

- `city="Delhi"` — default value
- `*hobbies` — any number of extra positional arguments (a tuple)
- `**details` — any number of keyword arguments (a dict)

## Lambda functions

Small anonymous functions, handy with `sorted`, `map` and `filter`:

```python
students = [("Asha", 91), ("Ravi", 78), ("Meera", 85)]
by_score = sorted(students, key=lambda s: s[1], reverse=True)
```

## Scope

Variables created inside a function are **local** to it:

```python
def counter():
    count = 1   # local
    return count
```

🎉 You've completed the Python tutorial basics. Continue with the *Python for Absolute Beginners* course to build a real project.
