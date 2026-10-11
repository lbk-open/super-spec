# One External Workflow Checkpoint

Use one host-managed protected task-artifact directory outside every project,
worktree, submodule, and skill installation. One checkpoint is canonical; original
host results and logs are linked, not copied into a second database. If a host
cannot supply it, an explicit external fallback such as
`${XDG_STATE_HOME:-$HOME/.local/state}/super-spec/<owner>/<task>/` may be used after
checking that it is outside project roots. No runtime helper is required.

The parent assigns stable logical taskId, repoId, and owner identity. Children
copy those identities verbatim, never derive storage from child session IDs or
select a 'latest' run. Multi-repo entries share this checkpoint with distinct
repo identities and workspace/evidence sections.

## Minimal fields

- `rawInput`: only necessary sanitized invocation text; source artifact references
  replace secrets, credentials, private provenance, and accumulated chat history.
- `normalizedFlags`, `gateCompletion` (human / auto / pending, kind, current
  proposal/spec/report byte bindings, real evidence/policy basis), `authorizedScope`.
- taskId, repoId, canonical project root and remote identity, branch, base and
  current version, workspace or `not-yet-created`, approved change-id and source paths.
- Actual owner/reviewer/verifier session identities and process handles, supported
  capabilities, status, original host results, terminal evidence and pending notifications.
- Targeted RED/GREEN/regression commands and exits; review findings/dispositions;
  final full commands and exits; currentFingerprint and evidence paths.
- Blockers, unresolved debt, cancellation, current stage and next action.

Store paths, sizes, digests and safe summaries, not private source dumps. Digests
are drift checks, not authorization. Missing artifacts or inaccessible original
results prove nothing; do not synthesize completion from summaries.

## Storage and safe update

Create directories with `0700`, files with `0600` (or equivalent host protection).
Canonicalize and validate roots before use. Reject root/descendant symlink escapes,
path traversal, dot/reserved identifiers, wrong task/repo identity, unexpected
permissions, and root drift. Atomic replacement within the protected directory
prevents partial checkpoint reads; never run a lock/signing/database engine.
Only the designated orchestrator updates checkpoint coordination fields; the
owner returns evidence paths and bounded deltas. Do not put toolkit state in the
project or modify project instructions without explicit consent.

## Current input binding

`currentFingerprint` identifies the actual full current candidate, not HEAD alone.
Use a canonical sorted inventory of paths, content hashes, bytes, modes, symlink
targets, tracked/untracked/ignored files, branch/base/HEAD identity, index and diff
hashes, relevant configuration hashes, and recursive submodule dirt/identity.
Hash sensitive configuration without emitting its contents. Secret-bearing files
must not enter raw backups/logs; record safe hashes or exclusions and the resulting
validation limitation. Exclude Git internals from delivered content scans, while
hashing the index/config as context. Evidence records both pre/post fingerprints;
input drift invalidates review/full validation even at unchanged HEAD.

On cancellation or failure preserve original logs and exact outstanding owner or
process identity. Do not replace a possibly live writer. Recovery verifies current
bytes, gates, workspace, pending work and terminal state before any new action.
Cleanup needs separate authorization for exact safe paths; there is no automatic
retention daemon, timed deletion, or permission inferred from uninstalling skills.
