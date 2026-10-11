# Living Specs

Authoritative capabilities live in openspec/specs; active change deltas live in
openspec/changes with a stable change-id. Read config context/rules and relevant
specs on demand; don't copy guardrails or toolkit state into the project.

Feature/semantic change delivery completes proposal plus applicable delta and
validation BEFORE human or explicit auto gate. If mutation must await gate, use a
protected external staged validation mirror. Record actual commands/outputs and
limitations. Restoring an unchanged existing promise can use no-delta only with
spec/invariant reference, rationale and evidence; changed semantics need a decision.

Planning reuses sufficient proposal/RCA decomposition and maps interfaces/invariants/
wiring/test intent; it never duplicates a delta or writes full implementation bodies.
After gate materialize identical approved bytes. Validate and archive authorized
changes into authoritative specs BEFORE independent review; publication never
performs late spec merges or rebase. Drift invalidates affected gate/review/tests.

Deltas use ADDED/MODIFIED/REMOVED/RENAMED Requirements; each requirement has a
four-hash Scenario. MODIFIED copies full original, REMOVED records Reason/Migration,
RENAMED records FROM/TO, and empty sections are removed. Retain exact strict project
validator output or honestly disclose unavailable native validation.

Standalone spec discovery remains usable: ss-write-spec, ss-archive, ss-show-spec,
ss-trace-spec, ss-list-changes and ss-reverse-spec. Mutation needs appropriate
permission; read-only discovery never creates workspace/state. See
[delta policy](../skills/ss-references/openspec-delta.md) and
[spec skill](../skills/ss-write-spec/SKILL.md).
