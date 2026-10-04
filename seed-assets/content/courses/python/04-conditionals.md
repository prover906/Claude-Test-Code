## Making decisions

Programs often need to choose what to do. Python uses `if`, `elif` and `else`:

```python
marks = int(input("Enter your marks: "))

if marks >= 90:
    print("Grade A")
elif marks >= 75:
    print("Grade B")
elif marks >= 50:
    print("Grade C")
else:
    print("Better luck next time")
```

> Indentation matters! Python uses 4 spaces to know which lines belong to each block.

### Comparison and logical operators

- `==`, `!=`, `<`, `>`, `<=`, `>=`
- `and`, `or`, `not`

```python
age = 19
has_ticket = True

if age >= 18 and has_ticket:
    print("Welcome to the show!")
```

**Exercise:** write a program that asks for a year and prints whether it is a leap year.
