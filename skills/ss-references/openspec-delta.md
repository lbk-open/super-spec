# Proposal and Delta Timing

Read project OpenSpec configuration, existing capability specs and active deltas
on demand. A semantic feature/change needs proposal plus applicable delta complete
and validated before the proposal gate. The gate binds current proposal/spec bytes
and records human or auto completion honestly. A proposal draft alone is not ready.

If a branch/workspace must not exist before approval, use a protected external
staged validation mirror: include relevant existing specs/config and the proposed
change, validate there without mutating the checkout. Keep one stable change-id
through staging, gate, workspace materialization, plan, archive and delivery.
Record exact artifact paths, commands, exits, digests, and limitations. A missing
validator is not a pass; use explicit structural checks and disclose that native
validation remains pending where required.

A repair restoring an existing promise can use no-delta only with a written reason,
the owning authoritative spec/invariant and evidence showing unchanged semantics.
No-delta is not permission to skip understanding or silently change a contract.
Changed semantics require a real scope decision and applicable delta before gate.

## Delta syntax and coverage

Use OpenSpec strict delta headings: `## ADDED Requirements`,
`## MODIFIED Requirements`, `## REMOVED Requirements`, `## RENAMED Requirements`.
Every requirement has a `#### Scenario:`; requirement prose uses SHALL/MUST.
MODIFIED copies the full original requirement then edits it. REMOVED includes
Reason and Migration. RENAMED records FROM and TO. Remove empty sections, reuse
capability ownership, and cover observable happy/error/edge behavior rather than
implementation bodies. Follow [the skeleton](openspec-skeleton.md) if bootstrapping
is authorized. Validate with the project's available strict OpenSpec command and
retain real output; do not pretend an unavailable CLI ran.

After gate, materialize identical approved proposal/delta bytes into the chosen
workspace and verify equality. Planning references these artifacts; do not generate
a second delta. Validate active deltas before authorized archive, then merge/archive
before independent review. Required rebase also precedes review, never publication.
A later drift invalidates affected gate/review/test evidence. Standalone
`ss-write-spec` and `ss-archive` remain usable, with explicit mutation permission
and the same timing/invariant constraints when called from a workflow.
