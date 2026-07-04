# Guardrails: Java

Read alongside `core.md` when the project is Java (or another JVM language following Java conventions). Covers exception handling, concurrency, and testing pitfalls that cause real bugs — not style or naming preferences.

## Exception Handling

### Only Catch What You Can Handle

Catch an exception only if the current method can genuinely recover from it: retry with a real chance of success, fall back to a cache or default, roll back local state, translate it into a business-level result, or clean up a resource before re-throwing. Otherwise let it propagate to a single, unified handler instead of catching it "just in case."

### Prefer Unchecked Exceptions

Use `RuntimeException` subtypes for business errors, infrastructure failures, and programming errors. Reserve checked `Exception` for library APIs where the caller genuinely must decide how to handle the failure (e.g., `IOException`). Don't force callers to declare `throws` for exceptions they can't meaningfully act on.

### Anti-Patterns to Catch in Review

**Empty catch block** — silently swallows the failure; the caller believes the operation succeeded.

```java
❌ try {
    doBiz();
} catch (Exception e) { }   // exception disappears without a trace
```

**Log-and-rethrow (double logging)** — logging inside a catch block and then re-throwing the same exception causes duplicate log entries once the caller (or the top-level handler) also logs it.

```java
❌ catch (Exception e) {
    log.error("failed", e);
    throw e;               // logged again by the caller
}

✅ catch (Exception e) {
    throw new BizException(ErrorCode.INTERNAL, "order processing failed", e);
    // log once, at the top-level handler only
}
```

**Losing the original cause** — discards the stack trace, making the real failure unreachable from the top-level log.

```java
❌ throw new BizException(ErrorCode.TIMEOUT, e.getMessage());        // cause lost
✅ throw new BizException(ErrorCode.TIMEOUT, "upstream call failed", e);
```

**Catching too broadly** — masks unrelated bugs (NPEs, OOM) as if they were the expected, handleable failure.

```java
❌ catch (Exception e) { ... }        // hides everything, including real bugs
✅ catch (TimeoutException e) { ... } // specific and intentional
```

**Swallowing a `NullPointerException`** — logging it and continuing lets the caller assume success on what was actually a silent failure.

```java
❌ catch (NullPointerException e) {
    log.error("error", e);
    // caller assumes success — silent failure
}

✅ catch (NullPointerException e) {
    log.error("error", e);
    throw e;    // or wrap: throw new InfraException("unexpected null", e)
}
```

**Error messages without context** — a message like "not found" is useless once it reaches production logs.

```java
❌ throw new BizException(ErrorCode.NOT_FOUND, "user not found");
✅ throw new BizException(ErrorCode.NOT_FOUND, "user not found: userId=" + userId);
```

### Resource Management

Always use try-with-resources for anything `Closeable`/`AutoCloseable`. A manual `finally { conn.close(); }` block can itself throw and mask the original exception; try-with-resources closes deterministically even when the try body throws.

```java
❌ Connection conn = getConnection();
   try {
       // ...
   } finally {
       conn.close();   // finally itself can throw, masking the original exception
   }

✅ try (Connection conn = getConnection()) {
       // conn is closed automatically, even if an exception occurs
   }
```

### Layered Responsibility

Keep exception handling at the right layer: repository/client code wraps infrastructure failures into an infrastructure-level exception; service code translates those into business exceptions with an error code; controllers do not handle exceptions directly — they delegate to a centralized exception-mapping layer that translates to HTTP responses. Don't let a controller method be full of try/catch blocks that belong in the service layer.

## Concurrency

### Basic Principles

Prefer immutable objects (no synchronization needed at all), avoid shared mutable state where possible, and when it's unavoidable, protect it explicitly. Prefer high-level concurrency utilities (`ExecutorService`, `CompletableFuture`) over raw `Thread` management, and name threads so a thread dump is actually debuggable.

### Anti-Patterns to Catch in Review

**`Collections.synchronizedXxx` as a load-bearing concurrency mechanism** — prefer a purpose-built concurrent collection.

```java
❌ Collections.synchronizedList(new ArrayList<>())
✅ new CopyOnWriteArrayList<>()      // read-heavy, write-light only
✅ new ConcurrentHashMap<>()         // general concurrent map
```
`CopyOnWriteArrayList` copies the whole backing array on every write — wrong choice for write-heavy code.

**Synchronizing on `this`** — exposes your lock to any external caller that also happens to synchronize on the same object.

```java
❌ synchronized(this) { ... }
✅ private final Object lock = new Object();
   synchronized(lock) { ... }
```

**Double-checked locking without `volatile`** — a lazily-initialized singleton field must be `volatile`, or another thread can observe a partially-constructed object.

```java
❌ private static Singleton instance;
✅ private static volatile Singleton instance;

// Better: a static holder class needs no volatile at all
private static class Holder {
    static final Singleton INSTANCE = new Singleton();
}
```

**Spawning a `Thread` per loop iteration** — uncontrolled thread creation exhausts system resources.

```java
❌ for (int i = 0; i < 1000; i++) {
    new Thread(() -> process(i)).start();
}

✅ ExecutorService executor = buildThreadPool();
   for (int i = 0; i < 1000; i++) {
       executor.submit(() -> process(i));
   }
```

**`CompletableFuture` chains with no exception handling** — an unhandled exception inside `supplyAsync`/`thenApply` disappears silently.

```java
❌ CompletableFuture.supplyAsync(() -> riskyOp())
    .thenApply(result -> process(result));  // exception silently swallowed

✅ CompletableFuture.supplyAsync(() -> riskyOp())
    .exceptionally(ex -> defaultValue)
    .thenApply(result -> process(result));
```

**Blocking I/O on the common `ForkJoinPool`** — that pool is meant for CPU-bound work; blocking calls on it starve every other user of the shared pool.

```java
❌ CompletableFuture.supplyAsync(() -> httpCall());
✅ CompletableFuture.supplyAsync(() -> httpCall(), ioExecutor);
```

**Missing `volatile` or atomics on shared fields** — a plain field mutated from multiple threads is a visibility or atomicity bug even if it "usually works" in testing.

```java
❌ private boolean running = true;       // not visible across threads
✅ private volatile boolean running = true;

❌ private int count = 0;
   count++;                              // not atomic
✅ private final AtomicInteger count = new AtomicInteger(0);
   count.incrementAndGet();
```

**Deadlock from inconsistent lock ordering** — if two code paths acquire the same two locks in opposite order, that's a deadlock waiting to happen.

```java
❌ Thread A: lock(a) → lock(b)
   Thread B: lock(b) → lock(a)          // circular dependency

✅ Always acquire locks in one fixed, consistent order (e.g., sort by System.identityHashCode)
```

### Thread Pools

Never use an unbounded queue in production (`Executors.newFixedThreadPool` defaults to one) — it turns backpressure into an OOM risk.

```java
❌ Executors.newFixedThreadPool(10)   // unbounded queue → OOM under load

✅ new ThreadPoolExecutor(
    coreSize, maxSize,
    60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(1000),   // bounded queue
    Thread.ofPlatform().name("worker-", 0).factory(),
    new CallerRunsPolicy()             // backpressure: caller runs task on overflow
);
```

Shut pools down gracefully rather than letting the JVM kill in-flight work:

```java
executor.shutdown();
if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
    executor.shutdownNow();
}
```

Virtual threads (Java 21+) are a good default for I/O-bound workloads instead of a large platform-thread pool, but they don't help CPU-bound work — CPU-bound tasks still run on the same limited carrier threads.

## Testing

- Don't reach for `@SpringBootTest` unless the behavior under test is genuinely coupled to the Spring context (security filters, auto-configuration). It loads the entire application context and is 10-50x slower than a plain unit test — use `@WebMvcTest` for the HTTP layer or a plain `@ExtendWith(MockitoExtension.class)` test for a bean in isolation.
- Unit tests must not depend on a real database, message broker, or network call — mock everything at the boundary, and reserve real infrastructure for integration-tagged tests.
- Avoid PowerMock, EasyMock, or JMock. Needing to mock static methods, constructors, or final classes is usually a sign the design should be refactored (e.g., wrap the static call behind an injectable interface) rather than a signal to reach for a heavier mocking tool.
