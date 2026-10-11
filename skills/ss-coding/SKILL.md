---
name: ss-coding
description: Implement an approved plan with one continuous owner, focused TDD, fresh independent review, and a retained final verifier.
---

# Implement and Review

Read [shared policy](../ss-references/workflow-common.md),
[checkpoint](../ss-references/workflow-checkpoint.md),
[agent discipline](../ss-references/agent-discipline.md), and
[implementer prompt](../ss-references/implementer-prompt.md).

## Inputs

An approved requirement, proposal, investigation, or short plan; actual workspace;
checkpoint with flags, gate state and authorized scope. Accept existing plan paths
and task lists; do not regenerate a sufficient plan or delta. If acceptance or
ownership is unclear, return to the appropriate gate, not a new architecture.

## Owner loop

Main coordinates only. Use the same logical owner across investigation, planning,
implementation and fixes at this code boundary. Multiple owners require proven
disjoint interfaces and dependencies, not a task count. Inherit the actual parent
model. Pass artifact references and necessary source contracts, not a transcript.

The owner understands affected source, callers, invariants and named scenarios;
implements behavioral RED first, minimum GREEN second, then refactors and runs
focused regression tests. Preserve real failing assertion/command/exit and the
minimum corrective change. Missing tools, syntax mistakes, absent files, or a
misconfigured environment are not behavioral RED. Documentation-only changes use
honest static validation, not manufactured behavioral TDD. Prompt clauses use
static RED/GREEN and weakening checks, not a claim of live agent execution.
The owner never runs the full suite. Record focused commands/exits/logs bound to
actual currentFingerprint; failures and cancellation are not successful tasks.

## Candidate before review

Materialize approved artifacts and perform authorized spec archive and required
rebase before review. Complete required commits before review, including accepted fixes,
only with existing Git authorization. For PR delivery, freeze the committed identity;
without commit permission, preserve the dirty candidate for honest local delivery.
Never defer a needed commit to publication. Inspect all pending user work; never
add unrelated files, discard or auto-stash.
Freeze the actual full dirty candidate, including ignored/untracked content,
submodule dirt, modes, symlinks, index and config identity. An unchanged HEAD does
not imply unchanged inputs. Use the checkpoint for artifact paths and evidence.

## Independent review and repairs

Call `ss-code-review` on the frozen candidate with a fresh read-only reviewer;
add specific specialist lenses only when concrete risk requires them. Missing or
failed required review returns INCOMPLETE_REVIEW and blocks advancement.
Main adjudicates findings with evidence. Accept valid scope defects, explicitly
reject disproven findings, and record out-of-scope debt without hiding uncertainty.
Do not use a confidence threshold, changed-line-only scope, or fixed review rounds.

Return to the continuous owner and group accepted fixes coherently. Run targeted
regression tests and preserve original failures. Substantive changes require a
fresh impact review of changed ownership/causal paths plus adjacent regression
surface. No self-approval, exhausted-budget acceptance, or outer workflow restart.
New product/scope decisions return to the gate. Unknown live writers block recovery.

## Final full validation AFTER review

Only an APPROVED independent review bound to the current candidate permits the
one retained verifier to start final full validation, single-flight AFTER review.
The verifier runs actual project full commands, not an invented adapter, captures
real completion, pre/post currentFingerprint, exits and protected external logs.
Main and the owner consume its bounded report; neither repeats full tests.

A full failure preserves logs -> same owner targeted repair -> fresh impact review
when substantive -> retained verifier revalidation of the new current candidate.
Do not waive failures, silently rerun stale evidence, impose retry quotas, or
mutate code concurrently with review/full validation. A lost process or unknown
writer preserves the checkpoint and blocks until terminal ownership is established.

Return status, checkpoint, currentFingerprint, review/full evidence, focused TDD,
accepted/rejected/deferred findings and blockers. Success requires identical review,
full-validation and delivery inputs; publication cannot commit/rebase/archive/fix later.
