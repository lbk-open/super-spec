# Guardrails: Go

Read alongside `core.md` when the project is Go. Covers error-handling and testing pitfalls that cause real bugs — not style or naming preferences.

## Error Handling

### Always Check Errors

Never discard an error from a meaningful call with `_`. If a function can fail, its caller must look at that failure — silently ignoring it is how a downstream nil-dereference or corrupted state shows up far from its actual cause.

### Handle an Error Once

Either handle an error (log it, recover, retry) or return it wrapped with more context — not both. Logging an error and then also returning it up the stack produces duplicate log entries and hides which layer is actually responsible for the failure.

### Wrap Errors With Context

```go
// GOOD — the caller can tell where this failed
if err := doSomething(); err != nil {
    return fmt.Errorf("do something: %w", err)
}

// BAD — no context about what was happening when it failed
if err := doSomething(); err != nil {
    return err
}
```

Use `%w` (not `%v` or `%s`) so the original error remains inspectable by the caller.

### Compare Errors With `errors.Is` / `errors.As`

Never compare an error to a sentinel with `==` once wrapping is involved — a wrapped error will never equal the sentinel directly.

```go
❌ if err == ErrNotFound { ... }              // breaks the moment the error is wrapped
✅ if errors.Is(err, ErrNotFound) { ... }      // unwraps the chain to compare

var appErr *AppError
✅ if errors.As(err, &appErr) { ... }          // extracts a typed error from the chain
```

### Sentinel and Custom Error Types

Define sentinel errors for conditions callers need to branch on:

```go
var (
    ErrNotFound  = errors.New("resource not found")
    ErrConflict  = errors.New("resource already exists")
    ErrForbidden = errors.New("operation not permitted")
)
```

For errors that need to carry structured data (a business error code, an underlying cause), define a custom type implementing `Error() string` and `Unwrap() error` so it stays compatible with `errors.Is`/`errors.As`:

```go
type AppError struct {
    Code    int    // business error code
    Message string // human-readable message
    Err     error  // underlying error, if any
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error { return e.Err }
```

### When to Panic

Panic only for truly unrecoverable conditions — a nil pointer during initialization, invalid configuration that makes the program unable to run at all.

```go
// BAD — panic used as ordinary control flow for an expected failure
func GetUser(id int) *User {
    user, err := db.Find(id)
    if err != nil {
        panic(err)   // caller has no chance to handle this gracefully
    }
    return user
}

// GOOD — return the error; let the caller decide
func GetUser(id int) (*User, error) {
    user, err := db.Find(id)
    if err != nil {
        return nil, fmt.Errorf("find user %d: %w", id, err)
    }
    return user, nil
}
```

Recover only at a top-level boundary (HTTP middleware, the `main` goroutine) — never scattered through business logic:

```go
// GOOD — a single recovery point per goroutine boundary
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if rec := recover(); rec != nil {
                log.Error("panic recovered", "error", rec)
                http.Error(w, "internal error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

Do not use `panic`/`recover` as a substitute for normal error returns; that turns predictable failures into unpredictable control flow that's invisible in a function's signature.

## Testing

### Mock Only at the Boundary

Unit tests must not touch a real database, network service, or file system — mock at the interface boundary. Never mock an external system directly in a unit test; use `testcontainers` or a dedicated integration test suite for that instead. Define interfaces at consumer boundaries specifically to make them mockable; a concrete-type-only dependency graph forces tests toward real infrastructure or awkward monkey-patching.

```go
// GOOD — the service depends on an interface, so tests can substitute a fake
type UserRepository interface {
    FindByID(id int) (*User, error)
}

func NewUserService(repo UserRepository) *UserService { ... }
```

### Prefer Table-Driven Tests

A single test function iterating over a table of cases is easier to extend and review than a wall of near-duplicate test functions, and it makes it obvious when a scenario is missing:

```go
func TestDivide(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
        wantErr  bool
    }{
        {name: "positive numbers", a: 10, b: 2, expected: 5},
        {name: "divide by zero", a: 1, b: 0, wantErr: true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Divide(tt.a, tt.b)
            if tt.wantErr {
                assert.Error(t, err)
                return
            }
            assert.NoError(t, err)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```
