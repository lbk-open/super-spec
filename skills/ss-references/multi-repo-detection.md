# Multi-Repo Detection Rules

Shared reference for how the `ss-feature-workflow`, `ss-coding-workflow`, and
`ss-troubleshooting-workflow` skills recognize that a requirement, plan, or fix spans more
than one git repository and must hand off to `ss-multi-repo-workflow`. Each workflow embeds a
condensed copy of this table; if the two ever disagree, this file is authoritative.

## Signal levels

| Level | Signal | Action |
|---|---|---|
| **Deterministic** | The input or a produced plan is a master plan (`docs/plans/*-master.md` whose header has a `**Repos:**` table with more than one row), or the plan set contains multiple sub-plans each carrying a `**Repo:**` field | Hand off immediately. Under an autonomous/no-questions mode, no confirmation is asked. |
| **High confidence** | A plan's file list contains paths outside the current repository root (`../<other-repo>/...`, or absolute paths outside the repo); a proposal's `**Repositories Involved:**` list has more than one entry; a root-cause report's `**Repositories Requiring Fix:**` list has more than one entry | Ask the user to confirm hand-off, showing the evidence. Autonomous mode hands off automatically. |
| **Heuristic** | The requirement, PRD, or root-cause narrative explicitly names two or more services/apps/repositories whose code must change; or a backend+frontend requirement where the current repo covers only one side | Ask the user, showing the evidence sentence(s). Autonomous mode hands off automatically. |

## Exclusions — not multi-repo signals

- **Shared API-contract repo changes** (e.g., a `share/api` or IDL/schema repo): handled by its own contract-build step; touching "this repo + the contract repo" alone stays single-repo.
- **Spec/standards submodules**: updating a vendored standards or guardrails submodule is not cross-repo development.
- **Read-only references to other services**: a PRD or root-cause report that merely *mentions* another service (as caller, dependency, or context) without requiring a code change there.
- **Multiple modules inside one repository** (monorepo packages, multi-module builds): an ordinary single-repo split that the planning skill handles without a master plan.

Judgment rule for the heuristic row: ask "does this fix/feature require **committing code in that other repository**?" If no, it isn't a signal.

## Hand-off protocol

When a workflow decides — or the user confirms — to hand off:

1. Pass to `ss-multi-repo-workflow`:
   - the original input (requirement link/text, issue reference, or master-plan path);
   - paths of artifacts already produced (proposal, plans, root-cause report, branch name);
   - the automation flags already in effect (skip-gates / decide-autonomously);
   - the detection evidence (which signal fired), so its own confirmation gate can display it.
2. The single-repo workflow prints one line explaining the hand-off and **terminates** — it must not run further steps of its own.
3. `ss-multi-repo-workflow` skips already-completed stages via its own artifact probing (resume detection); nothing is redone.
