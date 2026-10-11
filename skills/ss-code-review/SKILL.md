---
name: ss-code-review
description: Independently review a frozen current candidate and its causal impacts, with explicit uncertainty and fail-closed missing review.
---

# Independent Code Review

Use [agent discipline](../ss-references/agent-discipline.md) and
[checkpoint binding](../ss-references/workflow-checkpoint.md). Main schedules a
fresh read-only reviewer inheriting the actual parent model. The reviewer never
edits source, applies fixes, installs tools, or runs the full suite.

## Inputs and scope

Read approved requirements/scenarios, short plan or investigation, base/workspace,
currentFingerprint, source paths and targeted evidence from the checkpoint. Verify
current bytes before reading and on completion. Review the actual complete dirty
candidate, including new/ignored delivered files, configuration and submodule
changes; do not review only a commit diff or changed lines. Follow causal callers,
owning boundary, data/state flow, invariants, error paths, consumers and adjacent
regression surface. Use the diff as navigation, not as a correctness boundary.

## Review lenses

Default to one independent review. Add a security, concurrency, UI, persistence,
performance or spec lens only for demonstrated risk; all required lenses must
complete. Evaluate correctness, acceptance coverage, maintainability and misuse
against project patterns. Inspect tests and evidence without pretending to rerun
unavailable native behavior. No automatic model escalation, mandatory seat count,
or numeric file/task tier. Apply no confidence threshold for dropping material
observations and no fixed review rounds. State uncertainty and the precise missing
evidence instead.

A finding names severity, specific path/symbol/line, trigger, expected invariant,
actual consequence, supporting evidence and bounded recommended correction.
Distinguish in-scope defects, questions, and out-of-scope debt. Report pre-existing
causal risks honestly; do not expand scope or silently fix them. A disproven finding
can be rejected only with recorded evidence, never because an agent is exhausted.

## Result

- `APPROVED`: all required review completed, no unresolved blocking defects, and
  start/end currentFingerprint equal the submitted candidate.
- `CHANGES_REQUIRED`: supported defects require accepted owner fixes.
- `INCOMPLETE_REVIEW`: dispatch/tool/permission failure, missing required lens,
  inaccessible artifacts, cancellation, input drift or incomplete investigation.

Return verdict, currentFingerprint, coverage/lenses, findings, uncertainty, debt,
and original evidence references. Missing evidence cannot produce APPROVED.
Main adjudicates; the same owner groups accepted fixes and runs focused tests.
Substantive fixes receive a new fresh impact review, then the retained verifier
performs final full validation. Review never begins a parallel full-validation run.
