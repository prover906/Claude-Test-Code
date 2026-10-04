Strings are sequences of characters.

```python
language = "Python"
print(language[0])     # P
print(language[-1])    # n
print(language[0:3])   # Pyt  (slicing)
print(len(language))   # 6
```

## Formatting

```python
name, score = "Asha", 93.456
print(f"{name} scored {score:.1f}%")   # Asha scored 93.5%
```

## Common methods

```python
text = "  Learn Python Today  "
text.strip()            # "Learn Python Today"
text.lower()            # "  learn python today  "
text.title()            # "  Learn Python Today  "
"python" in text.lower()  # True
"a-b-c".split("-")      # ['a', 'b', 'c']
"-".join(["x", "y"])    # "x-y"
```

## Escape characters

```python
print("She said \"hi\"")
print("Line one\nLine two")
print("Tab\tseparated")
```

Strings are **immutable**: methods return a new string instead of changing the original.
