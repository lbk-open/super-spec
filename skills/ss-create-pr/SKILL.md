---
name: ss-create-pr
description: Publish or report an already reviewed and fully verified current candidate without late source mutations.
---

# Publish a Proven Candidate

Read [shared policy](../ss-references/workflow-common.md) and
[checkpoint binding](../ss-references/workflow-checkpoint.md). This step is not a
repair, planning, spec merge or validation workflow.

## Preconditions

Approved scope and gate bytes, actual workspace/base/currentFingerprint,
APPROVED independent review and PASS retained-verifier full evidence all cover
the exact present deliverable. Materialize artifacts, archive specs and perform
required rebase and any authorized required commits during candidate preparation
before review. Publication has no late commit and no late rebase, archive, source edit,
formatter, dependency install, cleanup or full-suite rerun. If current bytes differ,
stop and return to owner/impact review/retained verifier, never call stale evidence valid.
Git identity changes, including HEAD/index/diff, also invalidate the binding even
when file bytes are unchanged; there is no mechanical-identity exemption.

Check status/base/remote identity and user restrictions. Only push the committed identity
already bound to the same currentFingerprint in checkpoint, review and full evidence.
If that proven committed identity or push/request permission is absent, report local
delivery; never create a commit here to make the candidate publishable. Do not add
unrelated user files or silently discard local work.

## Delivery

Use only an available explicitly authorized repository hosting tool/remote.
Push the already proven committed branch and create a PR only when permitted, using actual target
base and protected summaries of requirement, spec changes, review, tests and risk.
A separately approved publication action does not authorize force push or upstream
history rewrite. If remote request creation is unavailable/prohibited, report
local delivery with the actual workspace/branch and evidence; do not invent a URL
or claim a PR exists. Preserve failure logs and distinguish local from remote state.

Return real delivery location, checkpoint, currentFingerprint, review/full evidence,
remaining debt and blockers. Never merge or deploy, release, auto-delete a branch,
or trigger unrelated hooks. Cleanup requires its own exact-path authorization.
