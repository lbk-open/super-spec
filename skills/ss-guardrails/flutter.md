# Flutter Guardrails

Apply this checklist when writing, reviewing, or generating Dart/Flutter code. It covers safety, correctness, and code-quality guardrails only — not which state-management approach to adopt, routing design, UI/theme choices, or code style.

## 1. Exception Types and Where to Handle Them

Use two distinct exception shapes and don't blur them:

- A domain/business exception for expected domain failures (invalid input, business rule violation).
- A server/network exception for failures originating from an API call (status code, malformed response, transport error).

```dart
class DomainException implements Exception {
  final String code;
  final String message;
  DomainException(this.code, this.message);
}

class ServerException implements Exception {
  final int code;
  final String message;
  final dynamic data;
  ServerException({required this.code, required this.message, this.data});
}
```

Handle errors at the layer that owns the decision, not wherever happens to catch them first:

- **Data/repository layer** — for a simple read, catch and return a safe default (`null`, `0`, an empty list). For a critical operation (submit, pay, confirm), catch, wrap into a typed exception, and rethrow — don't swallow it here.
- **State/notifier layer** — don't translate exceptions into UI strings here. Turn them into an explicit error state (an async/result wrapper's error case, or an error field on your state object) and let the UI layer decide how to render it.
- **UI layer** — render the three states (loading/data/error) via whatever your state wrapper exposes. Don't add a `try`/`catch` in the UI layer — the error should already be state by the time it reaches here.

```dart
// Simple read: default on failure
Future<String?> fetchTitle() async {
  try {
    final res = await api.getTitle();
    return res?.data?.title;
  } catch (_) {
    return null;
  }
}

// Critical operation: wrap and propagate
Future<OrderResult> submitOrder(OrderParams params) async {
  try {
    final res = await api.createOrder(params);
    return OrderResult.fromResponse(res);
  } catch (e) {
    throw DomainException('ORDER_ERROR', e.toString());
  }
}
```

## 2. Degradation Strategy

Every failure path needs an explicit, deliberate fallback — pick one per case, don't leave it undefined:

| Situation | Required fallback |
|---|---|
| List fetch fails | Empty-state UI + error message + retry action |
| Single item fetch fails | Default value or empty UI, not a crash |
| Critical action fails (submit/pay) | Visible error surfaced to the user — never swallowed silently |
| State initialization fails | Explicit error state the UI can render and recover from |

## 3. Logging Discipline

- Use the project's logger; never ship a `print()` or a `debugPrint()` call left over from local debugging.
- Log every caught exception that isn't handled by returning a safe default — include the error and stack trace, not just a message string.

```dart
// Correct
logger.error('API call failed', error: e, stackTrace: st);

// Forbidden
print('API call failed: $e');
debugPrint('something happened');
```

## 4. Lifecycle Safety (disposed-after-async)

- Any async method on a stateful notifier/controller must check whether the owner has already been disposed before writing to state after the `await` resumes. An async gap is exactly where a disposed object can still receive a callback.
- Don't keep updating state inside a `catch` block without that same disposed check — the failure path is just as capable of firing after disposal as the success path.

```dart
// Missing disposed check — can write to a dead notifier after an async gap
Future<void> refresh() async {
  final result = await api.fetch();
  state = state.copyWith(data: result); // may run after dispose
}

// Guarded
Future<void> refresh() async {
  final result = await api.fetch();
  if (isDisposed) return;
  state = state.copyWith(data: result);
}
```

- Any subscription, stream controller, or timer created by a notifier or widget must be cancelled/closed in its dispose path — an uncancelled subscription is a leak, and one that still calls back into a disposed object is a crash waiting to happen.

## 5. Bridge/Interop Calls

- Guard every cross-module or native-bridge call with null-safety (`?.call()` or an equivalent guard) — the capability may not be registered yet, especially early in app startup.
- If the capability is on a required path, don't stop at the null-safe call: add a logged fallback (default UI, error message) so a missing bridge registration degrades visibly instead of silently doing nothing.

## 6. Testing

Priority order: unit test > widget test > integration test. Default to writing a unit test unless the behavior can only be observed through the widget tree.

- Mirror the `lib/` directory structure under `test/`, with `<name>_test.dart` naming:

```
lib/repositories/order_repository.dart
  → test/repositories/order_repository_test.dart
```

- Cover both the success and failure path for any state/notifier change — a fix that only asserts the happy path is incomplete.
- Never depend on a real network call, real random values, or unmocked wall-clock time in a test — inject or override them.
- Don't write assertions that exist only to raise coverage numbers (`expect(true, isTrue)`); every assertion should be capable of failing when the behavior regresses.
- A bug fix needs a test that reproduces the bug — it fails before the fix and passes after.

| Change type | Minimum required coverage |
|---|---|
| Notifier / state controller | Success path + failure path |
| Repository / data source | Success path + failure returns a safe default |
| Model (`fromJson`/`copyWith`/computed fields) | Serialization round-trip + computed-field correctness |
| Widget | Key render states: loading / data / error |
| Bug fix | A minimal test reproducing the original bug |

## Final Checklist

- [ ] Domain and server/network exceptions use distinct types; no bare `Exception`/`String` thrown across layers.
- [ ] Errors are handled at the layer that owns the decision — no `try`/`catch` in the UI layer.
- [ ] Every failure path has an explicit, chosen fallback (default value, empty state, visible error) — none are silently swallowed.
- [ ] No `print()`/`debugPrint()` remains; caught errors are logged with error and stack trace.
- [ ] Every async state update checks a disposed guard before writing after an `await`.
- [ ] Every subscription/stream/timer created by a notifier or widget is cancelled/closed on dispose.
- [ ] Bridge/interop calls are null-guarded, with a logged fallback on any required path.
- [ ] Tests exist for both success and failure paths, mirror the `lib/` layout, and don't depend on real network/time/randomness.
