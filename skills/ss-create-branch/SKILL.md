---
name: ss-create-branch
description: Prepare an authorized isolated workspace or explicitly requested safe in-place branch without losing user work.
---

# Prepare Development Workspace

Read [workflow policy](../ss-references/workflow-common.md) and
[checkpoint](../ss-references/workflow-checkpoint.md). This skill prepares only
workspace/branch; it does not install dependencies, run tests or approve scope.
In prebranch feature/repair workflows run only after the applicable gate.

## Inputs and precedence

Goal/issue, stable task/repo identity, project root, delivery mode and normalized
workspace flags. Selection is explicit flag > repository default > isolated default.
--worktree/-w requests isolation; --no-worktree/-W requests in-place only where safe
and authorized. Reject conflicts; absence never silently means in-place permission.
Existing approved workspace is reused after identity checks, not recreated.

## Verify before creating

Inspect actual repository root, origin identity, remote default reference/tip,
current branch/HEAD, status including ignored/untracked and recursive submodule
dirt, worktree list, branch/path collisions and instructions. Fetch only when
permitted, from the existing origin; never rewrite remote or assume main/master.
Record verified default/base SHA or disclose that network refresh was unavailable.
Do not claim current upstream when only stale local references are known.

User dirty work is not toolkit scratch. Preserve it; no automatic stash, reset,
clean, submodule discard or .gitignore mutation. Never check out a dirty submodule
or change its identity merely to make a worktree command succeed. If pending work
must be incorporated, obtain explicit consent and protect secret-screened recoverable
external evidence. Unknown worktree ownership/process blocks creation/replacement.

## Creation

Use an authorized exact path outside the source project and a unique descriptive
branch from the verified base, e.g. `git worktree add <exact-path> -b <branch> <base>`.
Validate canonical parent/path and reject symlink escape/collision. Do not insert
untrusted input directly into shell code. In-place mode may create/switch a branch
only after dirty work and base safety are established. Permissions or unsupported
worktree capabilities stop the task: no silent in-place fallback or CLI switch.

There is no dependency installation/bootstrap ritual; don't install globally or
run package manager lifecycle hooks. No automatic change to project instructions,
submodules, shared config or existing checkout. Update checkpoint with exact workspace,
branch/base/current fingerprint and workspace policy. Return path and actual result.
Do not commit, push, test or clean up merely because workspace preparation finished.
