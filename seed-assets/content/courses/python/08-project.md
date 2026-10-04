## Project: number guessing game 🎯

Time to combine everything you've learned. The computer picks a random number and the player keeps guessing until they get it right.

### The plan

1. Pick a random number between 1 and 100.
2. Ask the player for a guess.
3. Tell them if it is too high or too low.
4. Repeat until they win, then show how many attempts it took.

### The code

```python
import random


def play():
    secret = random.randint(1, 100)
    attempts = 0
    print("I'm thinking of a number between 1 and 100.")

    while True:
        guess = input("Your guess: ")
        if not guess.isdigit():
            print("Please enter a whole number.")
            continue

        attempts += 1
        guess = int(guess)
        if guess < secret:
            print("Too low!")
        elif guess > secret:
            print("Too high!")
        else:
            print(f"🎉 Correct! You got it in {attempts} attempts.")
            break


if __name__ == "__main__":
    play()
```

### Challenges

- Limit the player to 7 attempts.
- Add difficulty levels that change the range.
- Keep track of the best score across rounds.

Download the source code using the **Resources** button below this lesson.
