## Strings and user input

Strings hold text. Use single or double quotes, and triple quotes for multiple lines.

```python
greeting = "Hello"
poem = """Roses are red,
Python is great."""
```

### f-strings

The easiest way to build strings is an **f-string**:

```python
name = "Ravi"
score = 92
print(f"{name} scored {score} marks")
```

### Useful string methods

| Method | Result |
| --- | --- |
| `"hello".upper()` | `"HELLO"` |
| `"  hi  ".strip()` | `"hi"` |
| `"a,b,c".split(",")` | `["a", "b", "c"]` |
| `"python".replace("p", "P")` | `"Python"` |
| `len("code")` | `4` |

### Reading input

`input()` pauses the program and returns whatever the user types, **always as a string**:

```python
name = input("What is your name? ")
age = int(input("How old are you? "))
print(f"Hi {name}, next year you will be {age + 1}.")
```
