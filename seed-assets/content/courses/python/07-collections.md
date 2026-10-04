## Lists and dictionaries

### Lists

A list is an ordered, changeable collection:

```python
skills = ["Python", "Git"]
skills.append("SQL")
skills.insert(0, "HTML")
print(skills[0])     # HTML
print(skills[-1])    # SQL
print(len(skills))   # 4
```

List comprehensions build new lists in one line:

```python
squares = [n * n for n in range(1, 6)]   # [1, 4, 9, 16, 25]
evens = [n for n in range(10) if n % 2 == 0]
```

### Dictionaries

A dictionary maps **keys** to **values**:

```python
student = {"name": "Priya", "age": 20, "city": "Pune"}
print(student["name"])
student["age"] = 21
student["course"] = "Python"

for key, value in student.items():
    print(f"{key}: {value}")
```

Use `.get()` to avoid errors when a key may be missing:

```python
print(student.get("email", "not provided"))
```
