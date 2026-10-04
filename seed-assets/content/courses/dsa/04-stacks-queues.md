## Stacks and queues

### Stack — last in, first out

```cpp
#include <stack>

stack<int> s;
s.push(1);
s.push(2);
s.top();  // 2
s.pop();
```

**Classic problem:** check whether brackets are balanced.

```cpp
bool isBalanced(const string& text) {
    stack<char> open;
    for (char c : text) {
        if (c == '(' || c == '[' || c == '{') open.push(c);
        else if (c == ')' || c == ']' || c == '}') {
            if (open.empty()) return false;
            char top = open.top();
            open.pop();
            if ((c == ')' && top != '(') || (c == ']' && top != '[') || (c == '}' && top != '{'))
                return false;
        }
    }
    return open.empty();
}
```

### Queue — first in, first out

```cpp
#include <queue>

queue<string> q;
q.push("Asha");
q.push("Ravi");
q.front(); // "Asha"
q.pop();
```

Queues power breadth-first search, task schedulers and print spoolers.
