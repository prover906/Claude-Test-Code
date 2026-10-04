## Functions

A function is a reusable block of code. Define it once, call it many times.

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("Asha"))
print(greet("Kabir"))
```

### Default and keyword arguments

```python
def power(base, exponent=2):
    return base ** exponent

power(5)              # 25
power(2, 10)          # 1024
power(exponent=3, base=4)  # 64
```

### Returning multiple values

```python
def min_max(numbers):
    return min(numbers), max(numbers)

low, high = min_max([4, 9, 1, 7])
```

### Why use functions?

- **Avoid repetition** — fix a bug in one place.
- **Readability** — `calculate_tax(amount)` explains itself.
- **Testing** — small functions are easy to test.
