# Web Frontend Guardrails

Apply this checklist when writing, reviewing, or generating React/TypeScript web frontend code. It covers safety, correctness, and code-quality guardrails only — it does not cover architecture choice, state-management library choice, routing, styling, or i18n; those are project-specific decisions, not guardrails.

## 1. Verification Before Claiming Done

- Never declare a change complete after running a single static check. Lint and typecheck are necessary, not sufficient.
- If the change touches interaction or layout, verify it in a real, running browser session. Don't infer correctness from source reading alone.
- Don't claim browser verification passed unless the dev server and any required backing services (mock or real) are actually running and reachable at the time you check. A verification claim against a service that never started is a false claim.
- Some test tasks depend on a build step. A green static check does not stand in for a build-dependent test; run the actual test task.
- Minimum bar for any non-trivial change: lint + typecheck + tests for the affected scope. Add a browser check whenever interaction or layout is at risk.

```bash
# Insufficient
pnpm lint

# Minimum acceptable
pnpm lint
pnpm typecheck
pnpm test
```

## 2. Component State Coverage

Every page-level or data-driven component must account for all of its states, not just the happy path:

- `loading` — while data is in flight
- `empty` — valid response with no data
- `error` — request failed or data is invalid
- `disabled` / `no-permission` — the user cannot act on this view right now

Treat a component that only renders the success case as incomplete, even if it "works" in the demo you tried.

```tsx
// Missing states
export function OrderList({ orders }: { orders: Order[] }) {
  return <ul>{orders.map(o => <li key={o.id}>{o.title}</li>)}</ul>;
}

// Complete
export function OrderList({ state }: { state: AsyncState<Order[]> }) {
  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error') return <ErrorNotice retry={state.retry} />;
  if (state.data.length === 0) return <EmptyNotice />;
  return <ul>{state.data.map(o => <li key={o.id}>{o.title}</li>)}</ul>;
}
```

## 3. Separation of Concerns

- Don't let a single component simultaneously fetch data, own complex derived state, and render presentation. Split into a container (data + state) and one or more presentational components (pure rendering from props).
- A component that mixes all three responsibilities is hard to test and hides bugs in code paths the "obvious" happy path never exercises.

```tsx
// Container and view mixed into one component
export function OrderCard() {
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => { fetchOrder().then(setOrder); }, []);
  return <div>{order?.id}</div>;
}

// Presentational component receives data, owns no fetch/side-effect logic
export function OrderCard({ order }: { order: Order }) {
  return <div>{order.id}</div>;
}
```

## 4. Single Source of Truth

- Don't let the same piece of data live in more than one place at once (e.g., a local `useState` copy of data that is also cached elsewhere, or two components independently fetching and holding the same resource). Divergent copies produce stale-state bugs that don't reproduce consistently.
- If a value has a canonical owner, always read through that owner. Don't snapshot it into local state "for convenience" — the snapshot goes stale the moment the source updates, and nothing tells you it happened.

```tsx
// Server data forked into local state
export function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { fetchOrders().then(setOrders); }, []);
  // A second consumer of the same resource now holds its own, possibly divergent, copy.
}

// Single owner; components read a selector/hook instead of forking state
export function OrderPage() {
  const orders = useOrders();
  return <OrderList orders={orders} />;
}
```

## 5. Effect Cleanup and Async Races

- Every subscription, timer, or event listener registered inside an effect needs a matching cleanup function. A missing cleanup is a memory leak and, on remount, a duplicate-handler bug.
- Guard async work started inside an effect against the component unmounting or its inputs changing before the response arrives. Ignore stale results instead of setting state on a component that no longer matches the request that produced the data.

```tsx
// No cancellation guard — a slow response can overwrite fresher state
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]);

// Guarded against stale responses
useEffect(() => {
  let cancelled = false;
  fetchUser(id).then(user => { if (!cancelled) setUser(user); });
  return () => { cancelled = true; };
}, [id]);
```

## 6. Testing

- New interactive components need at least one test covering the key state transitions, not just a static snapshot.
- Cover the failure and empty paths explicitly — a test suite that only exercises success is not sufficient.
- Prefer testing observable behavior (what the user sees or can do) over internal implementation details.

## Final Checklist

Before calling a web frontend change complete, confirm:

- [ ] Lint and typecheck pass for the affected scope.
- [ ] Tests cover the new/changed behavior, including at least one failure or empty-state case.
- [ ] If interaction or layout changed, you verified it in an actually running browser session with any required services reachable.
- [ ] Every new or touched component handles loading, empty, error, and disabled/no-permission states.
- [ ] No component both fetches/orchestrates complex state and renders presentation in the same place.
- [ ] No piece of data has two independent, divergent owners.
- [ ] Every effect that subscribes, schedules, or starts async work has a cleanup path and is guarded against stale results.
