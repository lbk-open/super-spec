# Guardrails: Core

Read this before writing or reviewing any code, regardless of language or stack. Security rules override style preferences, delivery speed, and pre-existing unsafe patterns already in the repo — if a spec conflicts with something you see in the surrounding code, follow the spec and flag the discrepancy.

When rules from different sources conflict, resolve in this order: security rules first, then project-specific overrides, then language/stack conventions, then general style. Distinguish **style** (naming, formatting, which equivalent library is already in use — follow whatever the surrounding file already does) from **correctness** (security, the guardrails in this file, stack-level rules) — correctness rules apply even to code that doesn't already follow them.

## Security Baseline

### Mandatory Risk Gate

Before changing code, decide whether it touches authentication, authorization, secrets, payments, financial balances, user credentials, admin operations, external callbacks, or other sensitive data.

- High-risk changes require server-side validation, authorization checks, idempotency, safe error handling, audit logging, and tests for the denial/failure paths. Never weaken a security check just to make a test pass.
- Default to secure: deny by default, least privilege, fail closed, no sensitive data in logs, no hardcoded secrets, no public debug endpoints, no permissive CORS, no disabled TLS or certificate verification.
- Do not invent your own cryptography, signing, random-number generation, key derivation, or permission model. Use vetted libraries or existing platform services, and get security-sensitive designs reviewed.

### Secure Defaults for Input and Web Surfaces

- Validate all external input server-side — HTTP requests, uploaded files, queue messages, scheduled jobs, webhooks, and third-party events. Prefer allowlists over denylists for type, length, range, format, and business state.
- Use parameterized queries or ORM-safe APIs for all SQL. Never build a query by concatenating user-controlled strings.

  ```
  ❌ query = "SELECT * FROM users WHERE id = " + userId
  ✅ query = "SELECT * FROM users WHERE id = ?"; bind(userId)
  ```

- Guard against XSS, CSRF, unsafe CORS, token leakage, unbounded session/token lifetimes, and rendering untrusted HTML without a reviewed sanitizer.
- Any server-side URL fetch triggered by user input needs a protocol/host allowlist, blocking of private-network addresses, redirect validation, a timeout, and a response-size cap.
- File upload, import, export, and archive-extraction code must reject unsafe file types, path traversal, zip-slip/symlink escapes, formula injection, oversized payloads, and unbounded decompression.

  ```
  ❌ outPath := filepath.Join(extractDir, entry.Name)   // entry.Name can be "../../etc/passwd"
  ✅ outPath := filepath.Join(extractDir, entry.Name)
     if !strings.HasPrefix(outPath, extractDir+string(os.PathSeparator)) {
         return fmt.Errorf("unsafe archive entry: %s", entry.Name)
     }
  ```
- Never pass user input into shell commands, template expressions, deserialization type names, or dynamic code evaluation.

### Secrets and Sensitive Data

- Never hardcode passwords, tokens, API keys, private keys, certificates, or connection strings in code, config, tests, Dockerfiles, CI files, or comments — including "just for local testing."

  ```
  ❌ apiKey := "sk-live-4f8a9c2b1e6d..."
  ✅ apiKey := os.Getenv("PAYMENT_API_KEY")   // resolved from the secrets manager at runtime
  ```

- Production and staging secrets belong in a secrets manager (Vault, KMS, cloud secret store, or equivalent). Reference them by placeholder or encrypted value, never plaintext.
- Treat as sensitive: passwords, MFA secrets, verification codes, session tokens, API keys, private keys, personal identifiers, financial data, and any internal risk/fraud-control logic. Don't send this data to logs, caches, metrics, analytics, exports, third parties, or bug reports — mask, hash, or omit it, and never fabricate realistic-looking sensitive data for tests or mocks.
- Audit logs for sensitive operations should capture actor, target, action, result, timestamp, and source, but never the plaintext secret or value itself. Error responses returned to external callers must never leak SQL, stack traces, file paths, internal hostnames, or config keys.
- New dependencies, build scripts, CI configuration, and install scripts must come from a trusted, actively maintained source with a license and vulnerability check, and should be version-pinned. Never weaken a CI security check to unblock a merge.

### Optional Module: Payments and Financial Systems

Apply this section only when the change touches balances, ledgers, deposits, withdrawals, or other money-movement logic.

- Balance-changing operations (deposits, withdrawals, transfers, fees, refunds, adjustments) must be idempotent across retries, redelivery, and duplicate callbacks.
- Ledger and balance updates must stay atomic and consistent under concurrency and retries — no duplicate credits/debits, no negative or invalid balances, no cross-account bleed.
- Use exact decimal types (never floating point) for money, price, quantity, and fee calculations. Define precision and rounding explicitly, and never trust an amount computed on the client.

  ```
  ❌ total := 0.1 + 0.2                 // binary float rounding error
  ✅ total := decimal.NewFromFloat(0.1).Add(decimal.NewFromFloat(0.2))
  ```
- Deduplicate retried or redelivered operations with an idempotency key tied to the business event, not just the HTTP request — a message-queue redelivery has no request ID to key off of, but the underlying business operation (e.g., `payout:{userId}:{requestId}`) still needs exactly-once effect.
- Manual balance adjustments, reconciliation, and compensation flows need fine-grained permission checks, a reason code, an audit trail, and ledger evidence — never a silent direct write.
- Payment/webhook callbacks must verify signature, timestamp, nonce, and replay window, and must never update a balance based solely on a client-submitted transaction reference.

## Code Review Standards

### No Self-Review

The agent or person who wrote a change must not be the one who approves it. Route every non-trivial change through an independent review pass — a different agent, session, or teammate — before it merges. This applies regardless of how small the change looks.

### Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| BLOCKER | Bug, security vulnerability, missing tests, or breaking compatibility | Must fix before merge |
| CONCERN | Spec violation, poor readability, or latent risk | Should fix |
| NIT | Minor polish or preference | Optional |

### What to Check

- **Correctness** — bugs, missed edge cases, missing error handling, race conditions and shared-mutable-state hazards, and whether the project's test command passes with zero skipped or disabled tests. New code should reach at least 80% line coverage (see the testing section below).
- **Spec compliance** — does the change follow this project's stack conventions (naming, API shape, error handling, logging) and its own project-specific overrides where they exist?
- **Security** — treat any violation of the security baseline above as a BLOCKER, not a CONCERN.
- **Performance and observability** — N+1 queries, unbounded loops, oversized synchronous batch operations, and high-cardinality values (user IDs, request IDs) used as metric tag values instead of log fields. Business-critical operations should have adequate logging, metrics, and tracing.
- **Breaking changes** — published API fields must not be removed or change meaning; schema changes need a rollback plan; config changes must stay backward compatible.
- **Soundness vs. minimal diff** — flag any implementation that avoids touching adjacent code (via duplication, a special-case branch, or a workaround) when the clean fix was to change that code directly. "Minimal" means minimal *scope*, not minimal *line count* — this is the in-scope counterpart to over-engineering, so don't confuse it with license to refactor things outside the task. Litmus test: if a reviewer would reasonably ask "why not just change that method directly?", the diff sacrificed soundness to look smaller — that's a CONCERN, not a stylistic nitpick.

### What Not to Flag

- Pre-existing issues the current change didn't introduce.
- Anything a linter, compiler, or type-checker already catches automatically.
- Style preferences that no spec explicitly requires.
- Items a spec marks as "recommended" rather than "must."
- Speculative over-engineering suggestions based on hypothetical future requirements.

### Report Format

```
[BLOCKER/CONCERN/NIT] Short description
Location: path/to/file:line
Reason: what rule or behavior this violates
Suggestion: (optional) how to fix it
```

If nothing is wrong, say so plainly: "Review passed, no issues found." Don't invent findings to appear thorough.

## Unit Testing Principles

- Write tests alongside new code, not after. For bug fixes, add a failing test that reproduces the bug before touching the fix.
- All existing tests must keep passing; never skip, disable, comment out, or weaken a test to get to green. If a test is wrong, fix the test with a clear justification — don't just delete the inconvenient assertion.
- New code should reach roughly 80% line coverage. Coverage is a floor, not the goal — a suite that hits the number by testing getters and skipping the failure path is not adequate.
- Test observable behavior: return values, thrown errors, and state changes on dependencies. Cover the happy path, the edge cases (null, empty, boundary values), and the error scenarios — all three, not just the happy path.
- Don't test private methods, trivial getters/setters, or framework/library behavior — that's not your code to verify.
- Each test follows Arrange → Act → Assert, covers exactly one behavior, and asserts something explicit — a test with no assertion isn't testing anything. Tests must not depend on shared mutable state or execution order.

  ```
  // Arrange — set up inputs and the object under test
  order := newOrder(amount: 100)
  // Act — call the single unit under test
  result := order.applyDiscount(code: "INVALID")
  // Assert — verify the outcome explicitly
  assertError(result, ErrInvalidDiscountCode)
  ```

- Mock only at architectural boundaries — external systems (databases, third-party APIs, filesystems, queues) and non-deterministic sources (clocks, random generators). Don't mock your own domain logic; use the real implementation when doing so doesn't make the test slow or flaky.

## Anti-Mistake Rules for AI Coding Agents

These are failure modes specific to AI-driven coding — watch for them in your own output before calling a task done.

- **Never fabricate a passing result.** Don't report tests as passing without having run them, don't hardcode expected outputs to make an assertion trivially true, and don't delete or skip a failing test to clear the way for a "done" status.

  ```
  ❌ assert result == 42   // rewritten to match whatever the buggy function actually returns
  ✅ assert result == expectedFromSpec   // test encodes the correct behavior, not the current output
  ```

- **Never swallow an exception to make an error disappear.** An empty catch block or a catch that logs and continues silently converts a real failure into a false success. Handle it, translate it into a meaningful error, or let it propagate — don't hide it.
- **Stay inside the requested scope.** Don't refactor unrelated code, rename things project-wide, reformat untouched files, or restructure directories unless asked. If you notice an unrelated problem, report it — don't fix it inline.
- **Minimal scope is not minimal diff.** Within the task's boundary, prefer the correct and clean implementation even if it touches more lines than a hacky shortcut would. Copy-pasting logic or bolting on a special case to avoid editing the "real" place is the failure mode to avoid, not a smaller diff.
- **Don't weaken guardrails to unblock yourself.** If a security check, lint rule, or test is inconvenient, that's a signal to fix the underlying issue — not to disable the check, add an exception, or loosen the rule.
- **Verify before claiming completion.** Run the project's actual test and lint commands and read their output; don't infer success from the code "looking right." If no such command exists, say so explicitly instead of assuming success.
- **Ask before changes that ripple across modules or touch shared contracts.** Silent, wide-blast-radius changes are harder to review and easier to get wrong than a short clarifying question.
