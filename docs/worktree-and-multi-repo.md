# Workspaces and Multiple Repositories

Workspace precedence: explicit --worktree/-w or --no-worktree/-W > repository
default > isolated default. Verify actual origin/default-tip/base identity and
permissions. Never assume main/master, auto-stash/discard user work, rewrite
.gitignore, silently fall back in place, or install dependencies to prepare a branch.
Inspect ignored/untracked files, submodule dirt, worktree ownership and symlink
paths. Unknown live ownership blocks replacement. [Branch skill](../skills/ss-create-branch/SKILL.md)
prepares exact authorized paths only; [cleanup](../skills/ss-cleanup/SKILL.md) is
separate exact-path consent with nonsecret recovery and never force removal.

Multi-repo routing uses confirmed proposal **Repositories Involved:**, master
**Repos:** / sub-plan **Repo:**, or complete RCA **Repositories Requiring Fix:**
with stable **Problem ID:** and **Affected Paths:**. Read-only references don't
create owners. Real shared-contract code changes need explicit dependency ownership.
See [detection](../skills/ss-references/multi-repo-detection.md).

Require native capability for actual repository child cwd/context, inherited
model, supported delegation/wait/terminal results. A prompt saying 'work here'
is not proof. Missing capability is BLOCKED; no automatic headless/CLI fallback.
Preserve flags, actual human/auto/pending gates, scope, checkpoint and per-repo
workspace/currentFingerprint. Schedule dependency-ready owners only. Failed or
missing results block dependents; do not rerun healthy repositories without cause.

Each owner retains focused TDD/fresh review/unique final verifier discipline.
Strict ---SS-RESULT--- consumer validates exact fields/types/enums, expected
identity and identical fingerprint-bound original review/full outputs before
SUCCESS. Required cross-repo integration has its own explicit acceptance evidence;
repo-local PASS does not prove integration. Report real local/PR locations, blockers
and unresolved debt; no fabricated umbrella PR or auto merge/cleanup.
