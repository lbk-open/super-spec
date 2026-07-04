# Guardrails: C++

Read alongside `core.md` when the project is C++. C++ gives you manual control over memory and lifetime, which means every ownership and concurrency decision must be deliberate — these are the mistakes that turn into use-after-free, data races, and crashes in production. Style and naming preferences are out of scope here; this is only what actually breaks.

## Memory Safety

### Make Ownership Explicit in the Type System

| Scenario | Type to Use |
|----------|-------------|
| Single owner, heap-allocated | `std::unique_ptr<T>` |
| Shared ownership (use sparingly — justify it) | `std::shared_ptr<T>` |
| Non-owning, nullable observation | raw `T*` |
| Non-owning, non-nullable observation | `T&` |
| Back-reference that would otherwise create a cycle | `std::weak_ptr<T>` |

### Anti-Patterns to Catch in Review

**Raw `new`/`delete`** — risks a leak if an exception is thrown before the matching `delete` runs.

```cpp
❌ Order* order = new Order(id);   // leaked if an exception fires before delete
✅ auto order = std::make_unique<Order>(id);   // freed automatically when out of scope
```

**Returning a pointer or reference to a local variable** — the referenced storage is gone the instant the function returns; this is undefined behavior, not just a bug that "usually works."

```cpp
❌ const std::string& GetName() {
    std::string name = "hello";
    return name;   // dangling reference — UB
}

✅ std::string GetName() {
    return "hello";   // returned by value; move/RVO applies
}
```

**`shared_ptr` used for objects with a single logical owner** — reaching for `shared_ptr` by default hides the real ownership model and adds needless atomic refcounting.

```cpp
❌ std::shared_ptr<Config> config = std::make_shared<Config>();  // just passed around, one owner
✅ std::unique_ptr<Config> config = std::make_unique<Config>();  // or const Config& where observing
```

**Circular `shared_ptr` references** — two objects holding `shared_ptr`s to each other never reach a refcount of zero and leak permanently.

```cpp
❌ struct Node {
    std::shared_ptr<Node> next;
    std::shared_ptr<Node> prev;   // cycle — never freed
};

✅ struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;    // breaks the cycle
};
```

**Raw pointer + length pairs for arrays** — loses bounds information at every call site.

```cpp
❌ void Process(int* data, size_t len);   // unsafe, size and pointer can drift apart
✅ void Process(std::span<int> data);     // bounds-aware, non-owning view
✅ void Process(std::vector<int>& data);  // owns the data
```

### RAII

Every resource — file handle, socket, lock, buffer — must be tied to an object's lifetime so it's released automatically, including on the exception path. Manual cleanup after the resource-using code is one missed early-return or thrown exception away from a leak.

```cpp
❌ FILE* f = fopen("data.txt", "r");
   // ... an exception here skips fclose entirely
   fclose(f);

✅ {
    std::ifstream file("data.txt");
    // use file...
}  // closed automatically on scope exit, even on exception
```

Write a small RAII wrapper for any third-party resource type that doesn't already provide one; don't rely on callers remembering to clean up.

### Move Semantics

Prefer moving over copying for large objects.

```cpp
✅ std::vector<Order> orders = BuildOrders();       // NRVO / move
✅ cache_.insert({key, std::move(heavy_object)});   // move into map
❌ cache_.insert({key, heavy_object});               // unnecessary deep copy
```

When a class manages a unique resource, explicitly delete its copy constructor/assignment rather than leaving a default-generated copy that would double-free or alias the resource:

```cpp
class ResourceHolder {
public:
    ResourceHolder(ResourceHolder&&) = default;
    ResourceHolder& operator=(ResourceHolder&&) = default;
    ResourceHolder(const ResourceHolder&) = delete;
    ResourceHolder& operator=(const ResourceHolder&) = delete;
};
```

## Concurrency

### Basic Principles

Prefer immutable shared data (a `const` object needs no synchronization at all), minimize shared mutable state, and when it can't be avoided, protect every access to it — not just the ones you noticed. Name threads so a hang or crash is debuggable from a backtrace alone.

### RAII Locks — Never Acquire a Mutex Manually

```cpp
// GOOD — released automatically even if an exception is thrown
{
    std::lock_guard lock(mu_);
    // critical section
}

// BAD — exception-unsafe
mu_.lock();
DoWork();
mu_.unlock();   // never reached if DoWork() throws
```

Use `std::scoped_lock` when acquiring multiple mutexes together (it locks them in a deadlock-free order internally), and `std::unique_lock` specifically when a `condition_variable` needs to unlock/relock during a wait.

### Condition Variables Need a Predicate

Always wait with a predicate lambda — `cv_.wait(lock, [this] { return !queue_.empty(); })` — never a bare wait. A bare wait is vulnerable to spurious wakeups and to missing a notification that arrived before the wait started.

### Atomics for Single-Variable State

Use `std::atomic<T>` instead of a full mutex when protecting exactly one variable (a running flag, a counter). A plain `bool`/`int` mutated from multiple threads without `std::atomic` is a data race and undefined behavior, regardless of how reliable it looks in testing.

### `std::jthread` Over `std::thread`

`std::thread` requires a manual `.join()` — if an exception unwinds past a joinable thread that was never joined, the program calls `std::terminate()`. `std::jthread` (C++20) joins automatically on destruction; prefer it for any new code.

### Deadlock Prevention

If two code paths can each acquire the same two locks in opposite order, that's a deadlock. Always acquire locks in one fixed, global order, or use `std::scoped_lock` so the standard library guarantees deadlock-free acquisition.

### Data Race Anti-Patterns

- A plain member field mutated by multiple threads (`count_++`) without an atomic or a mutex is a race even in a method as small as `Increment()`.
- Check-then-act on a shared container (`if (!map_.contains(key)) map_[key] = value;`) has a race window between the check and the write. Use the container's atomic operation (`try_emplace`) instead of a separate check.

## Error Handling

### Match the Mechanism to the Failure

| Failure Type | Mechanism |
|-------------|-----------|
| Expected business failure (not found, insufficient balance) | Return value — `std::expected<T, E>` or an error code |
| Truly exceptional condition or programmer error | Exception |
| Unrecoverable, process-level (invariant violated, config failed to load) | `std::terminate()` / `assert` |

Every function should document and satisfy one exception-safety level: `noexcept` (never throws), strong (state rolls back fully on failure), or basic (no leaks, object left in *some* valid state). Don't leave it undocumented and undecided.

### Anti-Patterns to Catch in Review

- **Swallowing exceptions** — `catch (...) {}` around a call that can fail lets the caller believe the operation succeeded. At minimum log with context and re-throw; don't silently absorb it.
- **Using exceptions for expected control flow** — catching `std::out_of_range` from `.at()` on a normal "might not be present" lookup is both slow and unclear. Use `.find()`/`std::optional` for lookups that are expected to sometimes miss.
- **Log-and-rethrow at every layer** — logging in an intermediate catch block and then rethrowing produces duplicate log entries once the top-level handler also logs. Log once, at the final handling point; intermediate layers should rethrow silently (or translate) without logging.

### Assertions

Use `assert()` for invariants that indicate a programmer error, not for runtime input validation — asserts are compiled out in release builds (`NDEBUG`). For invariants that must hold even in production, check explicitly and abort (`std::terminate()`) rather than relying on `assert`.

## Modern C++ Safety Notes

- **Never use a C-style cast.** `(int)some_double` or `(MyClass*)void_ptr` silently picks whichever cast (static, const, reinterpret) happens to compile, hiding what's actually being converted. Use the named cast that matches intent: `static_cast` for well-defined conversions, `reinterpret_cast` only for genuinely low-level reinterpretation, and never `const_cast` to work around a `const` you don't actually own.
- **Prefer `std::optional`/`std::expected` over sentinel return values.** A `nullptr`-or-object return (`Order* FindOrder(id)`) relies on every caller remembering to check for null; `std::optional<Order>` makes the "might not exist" case visible in the type and at the call site (`if (auto order = FindOrder(id))`).

## Testing (gtest/gmock)

- Unit tests must not depend on a real database, network call, or filesystem — mock every external dependency at its interface boundary using `gmock`; reserve real infrastructure for a separately named integration test target.
- Prefer `EXPECT_*` by default (non-fatal, the test keeps running after a failure so you see every mismatch in one run); use `ASSERT_*` only when a failed check makes the rest of the test meaningless to continue (e.g., a null result you're about to dereference).
- Use `EXPECT_DEATH` to verify code that's supposed to `assert`/`terminate` on invalid input — don't just skip testing that path because it "crashes on purpose."
- When testing `std::expected`-returning functions, assert both branches: that success returns the expected value, and that each failure mode returns the specific error code it should — not just that `has_value()` is false.
