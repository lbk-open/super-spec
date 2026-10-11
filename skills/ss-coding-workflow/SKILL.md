---
name: ss-coding-workflow
description: Deliver an approved plan with preserved gates and workspace, continuous-owner coding, independent review, and a strict terminal result.
---

# Coding Delivery Workflow

Read [workflow-common.md](../ss-references/workflow-common.md),
[workflow-checkpoint.md](../ss-references/workflow-checkpoint.md), and
[agent-discipline.md](../ss-references/agent-discipline.md).

## Inputs and preconditions

Accept `--plan <path>`, a bare existing plan path, approved proposal/investigation,
or an already sufficient task list. Consume --plan values before parsing remaining
flags. Carry sanitized rawInput, normalizedFlags, gateCompletion, authorizedScope,
workspace and currentFingerprint from the parent checkpoint unchanged. Missing
scope/acceptance/gate binding returns to the appropriate decision; coding is not a
back door around proposal/delta or root-cause confirmation. Retain the same logical
owner. Standalone callers must establish the same required gates honestly.

## Chain

1. Read existing artifacts/context and [multi-repo detection](../ss-references/multi-repo-detection.md).
   Confirm matching identity; handoff retains flags/gates/checkpoint and terminates
   this chain. Reuse sufficient plan decomposition, otherwise owner calls ss-plan.
2. Select full/lite mode from explicit invocation. Full uses ss-create-branch if
   workspace is not yet created; lite verifies authorized in-place/existing space.
   Existing parent workspace is reused, not recreated. Respect dirty/submodule safety.
3. Owner calls ss-coding: focused behavioral TDD, exact materialization/spec archive/
   required rebase and required commits BEFORE review, only with existing Git authorization.
   Freeze the committed identity for PR delivery or preserve honest local delivery;
   then fresh read-only review, grouped accepted fixes and fresh impact review.
   INCOMPLETE_REVIEW blocks, never counts as approval.
4. One retained verifier performs final full validation AFTER APPROVED review,
   single-flight on the identical currentFingerprint. Full failure -> same owner
   targeted fix -> fresh impact review when substantive -> retained revalidation.
5. ss-create-pr publishes only proven current inputs in full mode, or reports local
   delivery when remote/commit permission is absent. Lite ends locally with identical
   review/full quality. No late commit, no late rebase, archive, source repair or redundant tests.
6. Report the strict result below; cleanup has separate exact-path authorization.

Use supported waits and original host results; safe recovery resumes the same
logical owner with failures and gate context. Unknown writer, cancellation, scope
or input drift preserves checkpoint and blocks. Do not invoke fallback CLI/model.

## Strict producer result

---SS-RESULT---
{"taskId":"<stable task>","repoId":"<stable repo>","status":"SUCCESS|BLOCKED|CANCELLED|FAILED","checkpoint":"<absolute protected external path>","currentFingerprint":"<actual full candidate digest>","reviewEvidence":{"verdict":"APPROVED|CHANGES_REQUIRED|INCOMPLETE_REVIEW","currentFingerprint":"<digest>","path":"<original evidence>"},"fullEvidence":{"status":"PASS|FAIL|NOT_RUN","currentFingerprint":"<digest>","path":"<original evidence>"},"delivery":{"kind":"LOCAL|PR|NONE","location":null},"blockers":[]}
---SS-RESULT---

Emit exactly one JSON object between the exact paired result markers, not a
Markdown fence, extra marker, free-text pseudo-result or multiple candidate blocks.
The shown value alternatives are documentation, not valid literal enum values:
choose one. Reject unknown/duplicate keys, missing fields, wrong types and enum
values. taskId/repoId/checkpoint/currentFingerprint are nonempty strings; checkpoint
is an absolute protected external path linked to the expected task/repo/workspace.
reviewEvidence and fullEvidence each have exactly their shown three string fields;
delivery has exactly kind and location (string or null); blockers is an array of
nonempty strings. Never insert placeholders into an actual emitted result.

SUCCESS requires APPROVED review, PASS full validation and same currentFingerprint
in checkpoint, result, review and full evidence, real accessible terminal outputs,
zero blockers and LOCAL or PR delivery with a real nonempty location. PR requires
an actually created request, not an intended URL. BLOCKED, CANCELLED, FAILED are
not success and have nonempty blockers, preserve real state/logs, and may use
NONE delivery with null location; report actual observed verdict/status rather
than defaulting to APPROVED/PASS. A missing/invalid result is BLOCKED at the consumer.
