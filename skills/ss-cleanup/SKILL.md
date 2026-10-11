---
name: ss-cleanup
description: Safely remove only separately authorized exact owned workspace or external checkpoint paths while preserving user work and evidence.
---

# Scoped Cleanup

Cleanup needs separate authorization; PR creation, workflow completion or skill
uninstall never grants deletion authority. Read [checkpoint](../ss-references/workflow-checkpoint.md).
A dry-run inventory is safe when requested; deletion is not an implied next step.

Inputs name exact paths, branches/artifacts, scope and owner. Confirm canonical
roots, task/repo identity, permissions and symlink boundaries. Reject glob cleanup,
root/ancestor deletion, symlink escapes, unknown owner/process or mismatched checkpoint.
No policy retention timer, lock database or automatic expired-run deletion.

Inspect tracked, untracked, ignored and recursive submodule dirty work and known
live writers before removing a worktree. Unmerged/unpushed branches and original
failure/review/test logs remain evidence, not rubbish. Preserve necessary nonsecret
recoverable user content externally with restricted permissions and obtain consent
before discard; secret-bearing raw files must not be copied to recovery/logs.
Unknown process state or preservation conflict blocks deletion.

Use supported Git worktree removal and branch deletion only for exact authorized
owned paths/refs after safety checks; never force removal/reset/clean or infer that
all worktrees are disposable. Remote branch deletion needs explicit authority.
External checkpoint cleanup likewise checks exact root/identity and preserves
required original results. Do not delete arbitrary host sessions or project files.

Report exact removed/retained paths, protected backup references, skipped unsafe
items and actual errors. Cancellation stops cleanup and preserves remaining state.
Uninstalling the skill bundle changes discovery files only, not task artifacts.
