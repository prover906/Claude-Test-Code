## for loops

```python
for letter in "code":
    print(letter)

for n in range(5):          # 0..4
    print(n)

for n in range(2, 11, 2):   # 2, 4, 6, 8, 10
    print(n)
```

## while loops

```python
balance = 1000
years = 0
while balance < 2000:
    balance *= 1.08
    years += 1
print(f"Doubled in {years} years")
```

## break, continue and else

```python
for n in range(2, 10):
    for d in range(2, n):
        if n % d == 0:
            break
    else:
        print(n, "is prime")
```

The `else` block of a loop runs only if the loop finished **without** hitting `break`.

## Exercise

Print this pattern using nested loops:

```text
*
**
***
****
```
