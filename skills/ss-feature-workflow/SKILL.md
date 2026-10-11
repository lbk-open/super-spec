---
name: ss-feature-workflow
description: Deliver a feature from triage through proposal plus delta, explicit gates, continuous-owner coding, review, and final verification.
---

# Feature Delivery Workflow

Thin orchestration only: read [workflow-common.md](../ss-references/workflow-common.md),
[workflow-checkpoint.md](../ss-references/workflow-checkpoint.md),
[agent-discipline.md](../ss-references/agent-discipline.md), and
[openspec-delta.md](../ss-references/openspec-delta.md).
Main schedules, waits and arbitrates; the same logical owner investigates,
proposes, plans, implements and repairs at the shared code boundary.

## Inputs

Requirement link/text or existing proposal; `full` / `lite` delivery mode; invocation
flags from shared policy. Ask about missing requirement or mode without persisting
preferences. Carry sanitized rawInput, normalizedFlags, gateCompletion,
authorizedScope, workspace (initially not-yet-created) and currentFingerprint in
one external checkpoint and every handoff/recovery. --decide alone skips no gates.

## Ordered chain

1. Owner reads the complete input and relevant architecture. Triage complexity
   before any branch/workspace mutation; scope is not silently reduced. Reuse
   linked current artifacts bound to this input, never the newest file by recency.
   A simple fully specified change can use a compact proposal with no new design;
   it still needs proposal + applicable delta before human or explicit auto gate.
2. Owner calls `ss-proposal` when design is needed and `ss-write-spec` for applicable
   deltas. Validate before gate. If prebranch mutation is disallowed, use the
   external staged validation mirror; use stable change-id and exact source bytes.
   A no-delta path needs an existing unchanged promise and written evidence.
3. Main presents complete design/delta/risks and records actual human approval or
   eligible explicit --auto policy completion; it is not fabricated human approval.
   Bind gate to current proposal/spec bytes. --auto grants no new product semantics,
   safety permissions or destructive authority. New decisions pause at the gate.
4. Route confirmed multi-repo scope using
   [detection rules](../ss-references/multi-repo-detection.md), preserving all flags,
   gates/source bindings and checkpoint; this single-repo chain stops on handoff.
5. For full delivery call `ss-create-branch` after gate; for lite verify explicitly
   authorized existing workspace. No silent fallback. Materialize identical
   approved bytes and verify their binding. Record workspace/base/version.
6. Owner calls `ss-plan` only when sufficient decomposition is missing. Planning
   references approved delta, interfaces/invariants/test intent; no second design
   or exact-code script. Call `ss-coding` for focused TDD, pre-review spec archive/
   required rebase and required commits before review, only with existing Git authorization.
   Freeze the committed identity for PR delivery or preserve honest local delivery;
   then fresh read-only review and grouped owner fixes.
7. AFTER APPROVED review, the one retained verifier runs single-flight final full
   validation on the same currentFingerprint. Failure returns targeted repair to
   the owner, fresh impact review when substantive, then retained revalidation.
8. Full delivery calls `ss-create-pr` on the frozen proven candidate; prohibited
   remote/commit actions produce honest local delivery. Lite ends locally with the
   same quality evidence. Never merge/deploy. Cleanup is separately authorized.

## Resume or stop

Do not reconstruct approval from old checkboxes or PR existence. Recheck source,
gate and currentFingerprint and original host results, then resume the first
unproven stage with the same logical owner. Use supported notification/blocking
waits; never duplicate an unknown writer, switch CLI/model, or fabricate terminal
success. Cancellation/failure preserves checkpoint, process handles, original logs,
blockers and next action. No automatic project-state write or destructive cleanup.

Report checkpoint, workspace, gateCompletion, review/full evidence, currentFingerprint,
delivery, unresolved debt and blockers. Ready requires current complete evidence,
not only unchanged HEAD or an apparently successful wait.
