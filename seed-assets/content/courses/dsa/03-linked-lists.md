## Linked lists

A linked list is a chain of nodes where each node points to the next one.

```cpp
struct Node {
    int value;
    Node* next;
    Node(int v) : value(v), next(nullptr) {}
};
```

### Insert at the head — O(1)

```cpp
Node* pushFront(Node* head, int value) {
    Node* node = new Node(value);
    node->next = head;
    return node;
}
```

### Reverse a list — O(n)

A classic interview question:

```cpp
Node* reverse(Node* head) {
    Node* prev = nullptr;
    while (head) {
        Node* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
```

### Arrays vs linked lists

| Operation | Array | Linked list |
| --- | --- | --- |
| Access by index | `O(1)` | `O(n)` |
| Insert at front | `O(n)` | `O(1)` |
| Memory | Contiguous | Extra pointer per node |
