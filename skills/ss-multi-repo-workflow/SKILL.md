---
name: ss-multi-repo-workflow
description: Coordinate capability-checked repository owners with explicit dependencies, preserved gate context and strict fingerprint-bound results.
---

# Multi-Repository Delivery

Read [shared policy](../ss-references/workflow-common.md),
[checkpoint](../ss-references/workflow-checkpoint.md),
[agent discipline](../ss-references/agent-discipline.md), and
[detection](../ss-references/multi-repo-detection.md).
Main coordinates confirmed repository scope; it does not inspect/plan/code/test.
Use one checkpoint, stable parent task identity, distinct repoId/workspace/evidence
sections, sanitized rawInput, normalizedFlags, gateCompletion and authorizedScope.
Carry the exact source artifacts and current gate byte bindings through every handoff.

## Capability gate and decomposition

Require native capability to create a supported repository child with real cwd,
project context, model inheritance, supported nested delegation/review, waiting and
original terminal results. Verify observed cwd/context rather than inferring it
from a prompt. Record actual parent model with no override. Missing native capability
is BLOCKED: no automatic CLI, headless fallback, fabricated child, or protocol switch.
Explain the specific capability gap and preserve checkpoint for supported resumption.

Reuse complete confirmed proposal/RCA/master-plan decomposition; owner planning
fills only missing interfaces/invariants/wiring/test intent. Establish explicit
repository paths, branches/bases, artifact identity, source scenario mappings,
owners and dependencies. One continuous shared owner per code boundary; multiple
owners only for proven independent repositories/modules. Shared boundaries cannot
be split into competing writers. --auto does not approve a guessed repo list.

Schedule dependency-ready repositories only. Independent repos can progress in
parallel with distinct ownership; serial dependencies wait for accepted terminal
results, not an apparently completed process. Incompatible API/schema changes
require explicit producer/consumer integration order and acceptance evidence.
On failed/cancelled/missing result, stop blocked dependents and preserve their state;
never run them against assumed success. Do not restart healthy repos automatically.

## Repository runner

Each native runner verifies canonical project root/real cwd and invokes
ss-coding-workflow with the same flags/gates/scope, approved plan/RCA, checkpoint
and its distinct repoId/workspace. It retains the same logical owner across fixes,
a fresh independent reviewer and one retained verifier for its full revalidations.
Full commands are AFTER review and single-flight per frozen candidate, never owner
or Main tests. Cross-repo final integration, when required, has an explicit owner
and acceptance command/evidence; repo-local PASS alone does not prove integration.
Unknown writer or cancellation preserves process identity and blocks replacement.

## Strict consumer result

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

Validate the complete producer object against this contract and expected task/repo,
canonical workspace and currentFingerprint in accessible checkpoint/evidence before
acceptance. Reject status by text search, malformed JSON, multiple blocks, unknown
keys, fabricated artifacts or a successful wait with no terminal result. Consume
original host results, not unverified child summaries. Aggregate only after every
required repo and integration edge proves current success; expose blocked dependents.

Publication reports separate actual LOCAL/PR locations and unresolved debt, never
an invented umbrella PR, merge/deploy or destructive cleanup. Preserve original
results and checkpoint on infrastructure failure; resume only proven safe ownership
within the same approved protocol and scope.
