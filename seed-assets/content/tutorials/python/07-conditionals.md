Conditionals let your program make decisions.

```python
temperature = 31

if temperature > 35:
    print("It's very hot 🥵")
elif temperature > 25:
    print("It's warm ☀️")
else:
    print("It's pleasant 🌤️")
```

## Combining conditions

```python
age = 20
has_id = True

if age >= 18 and has_id:
    print("Entry allowed")

if not has_id:
    print("Please bring an ID")
```

## The ternary expression

```python
status = "adult" if age >= 18 else "minor"
```

## match (Python 3.10+)

```python
command = "start"

match command:
    case "start":
        print("Starting…")
    case "stop":
        print("Stopping…")
    case _:
        print("Unknown command")
```
