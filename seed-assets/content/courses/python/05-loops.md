## Loops

Loops repeat code so you don't have to.

### for loops

Use `for` to go through a sequence:

```python
for fruit in ["apple", "mango", "banana"]:
    print(fruit)

for i in range(1, 6):
    print(i)   # 1 2 3 4 5
```

### while loops

Use `while` when you don't know in advance how many times to repeat:

```python
count = 3
while count > 0:
    print(count)
    count -= 1
print("Lift off! 🚀")
```

### break and continue

```python
for n in range(1, 20):
    if n % 2 == 0:
        continue      # skip even numbers
    if n > 9:
        break         # stop the loop completely
    print(n)          # 1 3 5 7 9
```

**Exercise:** print the multiplication table of any number the user enters.
