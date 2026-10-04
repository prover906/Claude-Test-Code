## Variables

A variable is a name that points to a value. You create one with `=`:

```python
name = "Asha"
age = 21
height = 1.65
is_student = True
```

Python figures out the **type** for you. You can check it with `type()`:

```python
print(type(name))        # <class 'str'>
print(type(age))         # <class 'int'>
print(type(height))      # <class 'float'>
print(type(is_student))  # <class 'bool'>
```

### Naming rules

- Names can contain letters, digits and `_`, but cannot start with a digit.
- They are case-sensitive: `score` and `Score` are different variables.
- Use `snake_case` for readability: `total_marks`, not `TotalMarks`.

### Converting between types

```python
marks = "95"
total = int(marks) + 5   # 100
price = float("49.99")   # 49.99
label = str(42)          # "42"
```

**Try it:** create variables for your name, city and favourite number, then print a sentence using all three.
