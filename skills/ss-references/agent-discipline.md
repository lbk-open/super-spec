# Agent Ownership and Waiting

Main coordinates, consumes bounded summaries, and arbitrates gates. Main does not
investigate source, plan, code, repair, review code, or run tests. Brief status/Git
coordination is allowed. The one continuous owner investigates, plans, implements,
and performs targeted TDD and grouped fixes at a shared code boundary. Independent
owners are appropriate only for proven disjoint repositories or modules with
explicit interfaces/dependencies; never rotate writers per task or per failure.

All child roles inherit the actual parent model. Omit model overrides; record the
observed model when available, without inventing a tier. Never upgrade/downgrade
models or tools automatically. A fresh read-only reviewer is the default; add
specialist lenses only for concrete risks. Review is independent of generation
and owner fixes. Missing required review is incomplete, not waived.

Use one retained verifier for final full validation, single-flight AFTER independent
review. The owner runs focused tests only; Main and reviewers do not run full
suites. The verifier reports real commands, exits, original logs and pre/post full
input fingerprints. Keep that verifier for all full revalidation after fixes.

## Supported completion and continuation

Prefer host completion notifications, then supported blocking waits. For a live
long command, preserve its process handle and consume its real completion result.
A returned wait, timeout, missing notification, or local output file is not terminal
success. Use bounded waits/observations tied to actual host capabilities, not
invented polling APIs, process IDs, cwd guarantees, or a new coordinator.

Before retry/recovery, record the exact session/process state and last original
result. An unknown writer or possibly live process blocks replacement. If the
host proves termination, automatically resume the same logical owner within the
same approved scope, or restore that owner's fresh context from the checkpoint
when supported. Preserve failures, flags, human/auto/pending gates, workspace,
identities and original artifact references; never restart from a shortened task
that hides a failure. A host recovery failure preserves checkpoint and escalates:
no automatic CLI/protocol switch, invented result, or duplicate writer.

Cancellation stops scheduling immediately. Cancel only known owned processes using
supported controls, then confirm terminal state. Preserve evidence and unresolved
work; do not delete artifacts or report readiness until ownership is safe.
