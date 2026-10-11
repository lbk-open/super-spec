# Delivery Workflows

Invocation of a full workflow authorizes its approved chain through PR creation,
subject to proposal/root-cause gates and explicit restrictions. It never authorizes
merge/deploy/release, new product scope, spending, global install or destructive
cleanup. Full and lite share the same quality; lite is local delivery in an
explicitly authorized workspace, not a quality bypass.

## Invocation flags

--auto/-a completes eligible policy gates; --decide/-d chooses bounded reversible
options and is NOT auto approval. --worktree/-w and --no-worktree/-W select workspace
subject to safety/permission. Parse invocation only, including combined -adw/-daW;
quotes/code/URLs/documents are not flags, conflicting -wW stops, and option values
are consumed before flag parsing. Flags never persist. Handoffs/recovery preserve
sanitized rawInput, normalizedFlags, human/auto/pending gateCompletion,
authorizedScope, workspace and currentFingerprint in one external checkpoint.

## Feature

Triage before branch -> complete proposal plus applicable delta -> strict validated
external mirror if needed -> human or explicit eligible auto gate bound to current
bytes -> authorized workspace -> identical materialization -> reuse short plan ->
owner TDD -> pre-review archive/rebase/authorized required commits -> fresh review/grouped fixes -> retained
final full verification -> real PR or honest local delivery. Auto is never invented
human approval. Simple changes may use compact design but cannot evade spec/gate.

## Coding

Accept a plan/proposal/confirmed investigation or sufficient existing decomposition.
Verify gates/current bytes and workspace; do not regenerate sufficient plans or
deltas. Run the same owner/review/final-verifier chain. Produce strict paired
---SS-RESULT--- JSON with checkpoint, task/repo identity, currentFingerprint,
reviewEvidence/fullEvidence, delivery and blockers. Consumers validate complete
objects and original results, not text-search SUCCESS.

## Troubleshooting

Same owner performs report-only evidence-backed RCA first, understands owning
boundary/violated invariant/affected paths and rejects symptom patches. Before
root-cause confirmation prepare applicable delta, or justify no-delta restoration
of an unchanged existing promise. Gate binds current report/spec bytes. Then use
the same workspace/short-plan/TDD/review/final-verifier/delivery chain.

## Frozen delivery and recovery

Materialize/archive/required rebase and required commits BEFORE review, only with
existing Git authorization; accepted fixes repeat this preparation. Freeze the committed
identity for PR delivery or preserve an honest local dirty candidate when permission
is absent. Bind review/full/delivery to identical actual inputs, not HEAD alone:
bytes, modes, symlinks, HEAD/index/diff, config and submodule state. Publication has
no late commit or identity-only exemption, and cannot rebase/archive/repair/test
again; only push the already proven committed identity. If it or remote permission
is absent, report local delivery. Drift returns to impacted gate/owner/review/verifier. Full failure preserves
logs -> targeted owner repair -> fresh impact review -> retained revalidation.
Unknown writer, cancellation or incomplete evidence blocks success and preserves
checkpoint. Supported same-owner continuation carries all gate/context/failure state.

See [shared policy](../skills/ss-references/workflow-common.md) and
[checkpoint](../skills/ss-references/workflow-checkpoint.md).
