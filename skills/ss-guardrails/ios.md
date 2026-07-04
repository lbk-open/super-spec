# iOS Guardrails

Apply this checklist when writing, reviewing, or generating Swift/iOS code. It covers safety, correctness, and code-quality guardrails only — not architecture choice, UI framework choice (SwiftUI vs. UIKit), routing design, or code style.

## 1. Exception and Error Handling

Handle parsing, networking, routing, and native-bridge errors as distinct cases — don't collapse them into a single generic catch or a silently ignored `try?`.

- Never leave a `catch` block empty. At minimum, log the failure with enough context to diagnose it; in most cases also surface a fallback state to the caller.
- Distinguish expected failures (bad input, empty cache, offline) from exceptional failures (unexpected payload shape, decode failure) from programmer errors (invariant violation) — each deserves a different response: default value, propagated error, or fail-fast in debug builds.
- Any bridge or interop boundary (native ↔ web view, native ↔ embedded container) must return an explicit error result for invalid or malformed parameters. It must never crash the host app and must never fail silently with no signal to the caller.

```swift
// Silently swallowed — the caller has no idea it failed
guard let data = try? JSONDecoder().decode(Model.self, from: raw) else { return }

// Explicit, logged, propagated
do {
    let data = try JSONDecoder().decode(Model.self, from: raw)
    return .success(data)
} catch {
    logger.error("decode failed", error: error)
    return .failure(error)
}
```

## 2. Logging Discipline

- Use the project's designated logging/crash-reporting facility, not a raw `print()`/`NSLog()` call left in shipped code. Debug-only print statements that survive into a release build are a recurring source of noisy, unstructured logs and, worse, leaked data.
- Never log tokens, credentials, session identifiers, or full request/response payloads that may carry personal data. Logging must be diagnosable without being a data-leak vector.

## 3. Memory Safety (ARC)

- Any closure that captures `self` and can outlive the current scope — completion handlers, `@escaping` closures, async callbacks registered with a long-lived object — must capture `self` as `weak` or `unowned` unless you specifically intend to extend the object's lifetime. An unguarded `self` capture in a long-lived closure is a retain cycle: the object never deallocates, and its update code can keep firing against a view that's no longer on screen.
- When you use `weak self`, unwrap it defensively (`guard let self else { return }`) rather than force-unwrapping — the whole point of `weak` is that the object may already be gone.
- Verify that view controllers and their observers/timers are actually released when dismissed. A `deinit` that never fires is a signal that something upstream — a delegate, a closure, a notification observer — still holds a strong reference.

```swift
// Retain cycle: self is captured strongly in a closure the view controller itself owns
apiClient.fetch { result in
    self.updateUI(result)
}

// Weak self, safely unwrapped
apiClient.fetch { [weak self] result in
    guard let self else { return }
    self.updateUI(result)
}
```

## 4. Concurrency and Threading

- All UI updates must happen on the main thread/main actor. Don't mutate view state from a background queue or an arbitrary `DispatchQueue` callback without hopping back to main first.
- Don't perform blocking synchronous I/O (network, disk, large decode) on the main thread — it freezes the UI and is a common source of watchdog-triggered terminations.
- When shared mutable state is touched from more than one queue/task, protect it explicitly (serial queue, actor isolation, or a lock) — an unguarded shared mutable value accessed concurrently is a data race even if it "usually" works in testing.

## 5. Testing

- Every change needs a minimal, actually-run verification — don't merge with zero test or build evidence.
- Any change touching a native bridge, an embedded web/Flutter container, or dependency manifests (`Podfile`/SPM) needs an actual build verification, not just a code read-through.
- Copy, routing, container, and bridge changes should get at least a smoke check before you call them done.
- Structure tests as arrange → act → assert and cover both the success and the failure/edge path — a test suite that only exercises the happy path is not sufficient, and a static pass alone doesn't stand in for behavior verification.

```bash
xcodebuild build
xcodebuild test
pod install   # when dependencies changed
```

## Final Checklist

- [ ] Every catch/`try?` site does something observable; none silently discard the error.
- [ ] Parsing, networking, routing, and bridge errors are handled as distinct cases.
- [ ] No closure that outlives the current scope captures `self` strongly without a documented reason.
- [ ] Every `weak self` capture is unwrapped defensively, not force-unwrapped.
- [ ] All UI mutation happens on the main thread/main actor; no blocking I/O runs there.
- [ ] Shared mutable state touched from multiple queues/tasks is explicitly synchronized.
- [ ] Bridge/interop code returns explicit errors for invalid input instead of crashing or failing silently.
- [ ] Build and test evidence exists for this change, including a failure/edge-case test, not just the happy path.
