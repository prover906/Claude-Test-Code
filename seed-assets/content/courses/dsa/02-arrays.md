## Arrays and the two-pointer technique

Arrays store elements in contiguous memory, so reading `a[i]` is `O(1)`. Inserting in the middle is `O(n)` because elements must shift.

### Two pointers

Many array problems become linear when you move two indices toward each other.

**Problem:** given a *sorted* array, find two numbers that add up to `target`.

```cpp
pair<int, int> twoSum(const vector<int>& a, int target) {
    int left = 0, right = a.size() - 1;
    while (left < right) {
        int sum = a[left] + a[right];
        if (sum == target) return {left, right};
        if (sum < target) left++;
        else right--;
    }
    return {-1, -1};
}
```

This runs in `O(n)` time and `O(1)` extra space, versus `O(n²)` for checking every pair.

### Practice

- Reverse an array in place.
- Remove duplicates from a sorted array.
- Check whether a string is a palindrome.
