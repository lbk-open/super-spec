# Android Guardrails

Apply this checklist when writing, reviewing, or generating Kotlin/Android code. It covers safety, correctness, and code-quality guardrails only — not architecture choice, DI framework, routing design, UI toolkit choice, or code style.

## 1. Exception Handling

Distinguish three classes of failure and handle each deliberately — don't collapse them into one generic catch:

- **Expected failure** (bad input, missing cache entry, no network): handle inline, return a safe default or explicit result, and let the caller decide what to show.
- **Exceptional failure** (parse error, unexpected server payload, I/O failure): surface it as a typed error/result up to a layer that can decide on a recovery or fallback UI.
- **Fatal/programmer error** (invariant violation, illegal state): fail fast and loud in debug builds rather than papering over it.

Never write an empty catch block, and never rely on `printStackTrace()` as your only handling — both are dead ends that hide the failure from anyone who isn't staring at the console at the exact moment it happens.

```kotlin
// Swallowed error, invisible in production
try {
    parsePayload(raw)
} catch (e: Exception) {
}

// Explicit outcome, logged, callable by the caller
try {
    parsePayload(raw)
} catch (e: ParseException) {
    logger.error("payload parse failed", e)
    return Result.failure(e)
}
```

- Treat network, routing, parsing, and business-rule errors as distinct categories — a network timeout, a malformed deep link, and a validation failure need different recovery paths, not one shared catch-all.
- Use the project's structured logger rather than the platform's raw log function, and never log tokens, credentials, PII, or full request/response bodies that may contain sensitive fields.

## 2. Lifecycle and Memory Safety

- Don't put non-trivial business logic inside a `Fragment`/`Activity` lifecycle callback (`onCreate`, `onResume`, etc.). Lifecycle methods can be called multiple times and in surprising orders; logic that assumes "called once" living there is a recurring source of duplicate-execution and leak bugs. Extract it into a testable unit that the lifecycle method merely invokes.
- Never let a long-lived object (singleton, static field, application-scoped holder) hold a strong reference to an `Activity`, `Fragment`, or `View`. That reference outlives the screen and leaks the entire view tree.
- Any `Handler`, animation, or scheduled callback that captures a view or activity must be cancelled/removed when that lifecycle owner is destroyed — an uncancelled callback is a guaranteed leak and a candidate for a crash against a now-dead view.
- Coroutines and Flow collectors must run inside a scope tied to the lifecycle that started them (`viewModelScope`, `lifecycleScope`, or an equivalent owned scope). Don't launch long-running work from `GlobalScope` or an unscoped `CoroutineScope` — it keeps running (and can keep touching UI) after the screen is gone.

```kotlin
// Unscoped coroutine outlives the screen that started it
GlobalScope.launch { val result = api.fetch(); updateUi(result) }

// Scoped to the owning lifecycle, cancelled automatically on destroy
viewModelScope.launch { val result = api.fetch(); _state.value = result }
```

## 3. Defensive Handling of External Input

- Any input crossing a module or navigation boundary (deep link params, bundle extras, bridge/container call arguments) must be validated before use. Malformed or missing parameters must degrade gracefully — show a fallback, no-op, or default screen — never crash the app.
- Don't pass external input straight through to a lower-level API "as-is." Validate presence, type, and range at the boundary before it reaches business logic.

```kotlin
// Unvalidated param dereferenced directly — crashes on malformed input
fun openDetail(bundle: Bundle) {
    val id = bundle.getString("id")!!
    navigate(id)
}

// Validated, degrades instead of crashing
fun openDetail(bundle: Bundle) {
    val id = bundle.getString("id")
    if (id.isNullOrBlank()) { navigateToFallback(); return }
    navigate(id)
}
```

## 4. Testing

- Every change needs at least a minimal verification: don't merge a behavior change with zero test or manual-verification evidence.
- Bug fixes need a regression test that reproduces the bug before the fix and passes after.
- High-traffic paths (login, checkout, messaging, anything on the app's main flow) need explicit test coverage of both success and failure/edge cases, not just the happy path.
- A static pass (`lint`) is not equivalent to an overall pass. Run the actual behavior verification for the change:

```bash
./gradlew test
./gradlew lint
./gradlew assembleDebug
```

- For JS/Flutter-in-native hybrid surfaces, verify both the host and the embedded container actually run — a host-only check misses container-side regressions.
- For anything touching sockets/websockets, routing, cache, or auth/session state, add coverage for the edge and reconnect paths, not just the steady-state flow.
- Structure tests as arrange → act → assert, with names and assertions that state what behavior is under test — not a bare `assertTrue(result)`.

## Final Checklist

- [ ] Every catch block does something observable (log, return default, propagate) — none are empty, none use `printStackTrace()` only.
- [ ] Network/parsing/routing/business errors are handled as distinct cases, not one generic catch.
- [ ] No lifecycle callback carries logic that assumes it runs exactly once.
- [ ] No static/singleton/application-scoped reference holds onto an Activity, Fragment, or View.
- [ ] Every coroutine/Flow collector launched by this change runs inside a scope tied to its owning lifecycle.
- [ ] External input (deep link, bundle, bridge args) is validated before use, with a graceful fallback instead of a crash.
- [ ] Tests exist for this change, cover failure/edge paths, and were actually run — not just added.
