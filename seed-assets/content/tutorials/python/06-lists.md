Lists store multiple items in one variable.

```python
marks = [78, 92, 65, 88]
```

## Accessing and changing items

```python
marks[0]        # 78
marks[-1]       # 88
marks[1:3]      # [92, 65]
marks[2] = 70
```

## Adding and removing

```python
marks.append(95)        # add to the end
marks.insert(0, 50)     # add at index 0
marks.remove(70)        # remove by value
last = marks.pop()      # remove and return the last item
```

## Sorting

```python
marks.sort()                  # ascending, in place
marks.sort(reverse=True)      # descending
ranked = sorted(marks)        # returns a new list
```

## Looping

```python
for index, mark in enumerate(marks, start=1):
    print(f"Student {index}: {mark}")
```

## Useful built-ins

```python
sum(marks)   # total
max(marks)   # highest
min(marks)   # lowest
len(marks)   # count
```
