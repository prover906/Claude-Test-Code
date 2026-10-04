## Big-O notation

Big-O describes how the running time (or memory) of an algorithm **grows** as the input size `n` grows. It ignores constants and focuses on the dominant term.

| Complexity | Name | Example |
| --- | --- | --- |
| `O(1)` | Constant | Access `arr[i]` |
| `O(log n)` | Logarithmic | Binary search |
| `O(n)` | Linear | Loop over an array |
| `O(n log n)` | Linearithmic | Merge sort |
| `O(n²)` | Quadratic | Nested loops |

### Counting operations

```cpp
int sum(const vector<int>& a) {
    int total = 0;              // O(1)
    for (int x : a) total += x; // O(n)
    return total;               // O(1)
}
// Overall: O(n)
```

```cpp
bool hasDuplicate(const vector<int>& a) {
    for (size_t i = 0; i < a.size(); i++)
        for (size_t j = i + 1; j < a.size(); j++)
            if (a[i] == a[j]) return true;
    return false;
}
// Overall: O(n²)
```

**Interview tip:** always state both time *and* space complexity of your solution.
