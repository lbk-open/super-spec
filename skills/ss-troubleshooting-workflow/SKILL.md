---
name: ss-troubleshooting-workflow
description: Investigate a reported failure, confirm root cause and repair contract, then use continuous-owner coding, review, and final verification.
---

# Troubleshooting Delivery Workflow

Read [workflow-common.md](../ss-references/workflow-common.md),
[workflow-checkpoint.md](../ss-references/workflow-checkpoint.md),
[agent-discipline.md](../ss-references/agent-discipline.md), and
[delta rules](../ss-references/openspec-delta.md).

## Context

Input is issue/alert/link/text or a completed matching investigation. Main only
coordinates; the same logical owner investigates, plans, codes and repairs at this
boundary. Preserve stable Problem ID and sanitized rawInput, normalizedFlags,
gateCompletion, authorizedScope, workspace/not-yet-created and currentFingerprint
in the one checkpoint through every delegation, multi-repo handoff and recovery.
Read full original artifacts on demand; recency and a terse summary are not proof.

## Ordered chain

1. Owner calls report-only `ss-inspect`, or reuses a complete verified report for
   this Problem ID. Require independent corroborating evidence and understanding
   of relevant design/implementation, causal flow and affected paths before repair.
   Keep **Violated Invariant:**, **Owning Boundary:**,
   **Patch-Style Alternative Rejected:** and **Repositories Requiring Fix:**.
2. Before root-cause confirmation, validate applicable delta when semantics change.
   A restoration of an existing promise uses no-delta only with the specific
   authoritative promise, unchanged semantics rationale and evidence. Use protected
   external staged validation mirror when checkout must not yet be mutated. New
   semantics are a scope decision, not an inferred bug-fix permission.
3. Main presents report + repair contract/delta and records real human root-cause
   confirmation, or explicit eligible --auto policy completion. --decide alone is
   not approval. Gate binds current report/proposal/spec bytes and evidence; auto is
   never fabricated human confirmation and grants no new permissions.
4. Confirmed multi-repo scope follows [detection](../ss-references/multi-repo-detection.md),
   carrying flags/gates/checkpoint/Problem ID and stopping this single-repo chain.
5. Create authorized full workspace with ss-create-branch, or verify lite workspace.
   Materialize identical gated artifacts. Owner reuses sufficient repair breakdown
   or calls ss-plan for a short interface/invariant/test-intent map; no repeated RCA.
6. Call ss-coding for real focused regression RED -> minimum GREEN -> refactor;
   archive/materialize/rebase and complete required commits before review, only with
   existing Git authorization. Freeze the committed identity for PR delivery or preserve
   honest local delivery; then fresh independent review. Group accepted fixes with the
   same owner and obtain fresh impact review when substantive.
7. One retained verifier runs final full validation AFTER APPROVED review on the
   same currentFingerprint. Preserve failures -> targeted owner fix -> fresh impact
   review -> retained current validation. Never parallelize review and full tests.
8. ss-create-pr reports an actual PR or honest local delivery; never merge/deploy.
   Cleanup needs separate authorization. Full and lite share all quality gates.

Incomplete RCA/review, unknown writer, input drift, cancellation or host failure
preserves the checkpoint and original results. Supported safe continuation resumes
the same logical owner within existing authority; no CLI/model switch or duplicate
writer. Report gateCompletion, currentFingerprint, evidence, delivery and blockers.
