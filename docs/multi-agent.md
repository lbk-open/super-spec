# Agent Roles and Evidence

Main schedules, waits, consumes bounded reports and arbitrates findings/gates;
Main does not investigate source, plan, code, repair, review code or run tests.

| Role | Work | Forbidden shortcut |
| --- | --- | --- |
| Continuous owner | Investigation, short plan, implementation and grouped fixes; behavioral RED -> minimum GREEN -> focused regression | Full-suite runs or self-approval |
| Fresh read-only reviewer | Current full candidate, causal callers/invariants/consumers, explicit uncertainty/debt | Edits, changed-line blindness, confidence dropping |
| One retained verifier | Single-flight full validation AFTER APPROVED independent review, including every full revalidation | Stale-input pass or wait-only success |

All children inherit actual parent model, without overrides or model tiers. Keep
one owner for overlapping boundaries; parallel owners need proven disjoint scope
and explicit dependencies. Do not split tasks into fresh writers to avoid context.

A full failure preserves original logs, returns targeted repair to the same owner,
gets fresh impact review when substantive, then current retained verification.
Missing review is INCOMPLETE_REVIEW. No fixed review rounds, exhausted-budget
acceptance, custom admission adapters or parallel review/full windows.

Use host notifications or supported blocking waits. Retain exact session/process
handles and original terminal results. Timeout or missing notification is not
success. Unknown live writer blocks replacement; supported recovery keeps the same
logical owner, failures, gates, flags, workspace and checkpoint. No automatic CLI/
protocol/model switch. Cancellation stops scheduling and preserves evidence.

See [agent discipline](../skills/ss-references/agent-discipline.md) and
[implementer handoff](../skills/ss-references/implementer-prompt.md).
