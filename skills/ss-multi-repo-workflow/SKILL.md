---
name: ss-multi-repo-workflow
description: Executes a requirement that spans multiple git repositories — plans once, then runs one headless coding-agent sub-process per repository (each running ss-coding-workflow inside its own repo), batched by dependency order, and consolidates all resulting PRs into one cross-repo report. Use only when explicitly invoked or handed off from a single-repo workflow's multi-repo detection.
---

# Multi-Repo Workflow

Executes a requirement that spans **multiple git repositories**: plan once, then run one
**headless sub-process per repository** (each running `ss-coding-workflow` inside its own repo),
batched by dependency order, and finally consolidate all pull requests into one cross-repo report.

**Why processes, not subagents.** A subagent inherits *this* session's configuration — it never
loads the target repo's own project instructions, specs, or skills. A headless sub-process
started with its working directory set to the target repo is a full, independent agent session
that discovers that repo's own configuration natively, and can spawn its own implementer/reviewer
subagents inside it. This gives two levels of parallelism without nesting subagents inside
subagents.

```
Orchestrator (this session)
  ├── in repo-a: run ss-coding-workflow <plan-a>, autonomous, lite/full     ┐ batch 1 (parallel)
  ├── in repo-b: run ss-coding-workflow <plan-b>, autonomous, lite/full     ┘
  └── in repo-c: run ss-coding-workflow <plan-c>, autonomous, lite/full       batch 2 (after batch 1)
```

**Core principle: thin orchestration.** This skill never writes code and never edits files inside
the target repositories. Planning-stage work is delegated to other `ss-*` skills in this session;
execution-stage work is delegated to per-repo sub-processes.

## When to Run

Only run this when the user explicitly asks for it, or a single-repo workflow hands off to it
after multi-repo detection (see `../_references/multi-repo-detection.md`). Do not auto-trigger it
for ordinary single-repo work.

## Inputs

- **Planning input**, one of:
  - a path to an existing master plan (see "Input Type Detection"), or
  - a requirement/PRD link, issue link, or plain-text requirement — triggers the planning stage
    first.
- **Delivery mode** — `full` (default) or `lite`, forwarded to every per-repo
  `ss-coding-workflow` invocation. See `ss-coding-workflow`'s "Delivery Mode" section; the choice
  is made once here and applied uniformly across repos.
- **Skip-gates** — skip the manual multi-repo execution gate.
- **Decide-autonomously** — resolve clarification questions without pausing; also forwarded to the
  planning-stage skills.
- **Agent CLI** — which coding-agent CLI to use for sub-processes (for example, the CLIs behind
  Claude Code, Codex, Pi Agent, or OpenCode — any CLI that supports a non-interactive/headless
  invocation mode with a text prompt). Defaults to whichever CLI this orchestrator itself is
  running under.
- **Allow unattended edits** (optional, default off) — pass an auto-approve/yolo flag through to
  sub-processes in trusted environments only.

## Iron Rules

Violating any of these means stopping and explaining to the user:

1. **The orchestrator does no real work** — during planning, only call other `ss-*` skills;
   during execution, only spawn/monitor sub-processes and collect results. Never edit source
   files in any target repository.
2. **Sub-processes always run fully autonomous** — a headless sub-process has nobody to answer
   its questions; any gate or clarification inside it would hang until timeout. All human
   decisions happen in **this** session: before spawning (the multi-repo gate) or after a failure
   report (escalation).
3. **Batch order is a hard constraint** — repos in the same batch may run in parallel; batches run
   strictly in the master plan's dependency order. A consumer of an API never starts before its
   provider's batch completes.
4. **Distribute sub-plans before spawning** — copy each repo's sub-plan into that repo first; a
   sub-process never reads plans across repositories.
5. **Verify every repository's result individually** — PR link, verdict, and task completion for
   each repo. A failed, timed-out, or blocked repo must never be hidden inside an aggregate
   report.
6. **Full-scope delivery — no unauthorized reduction** — every repository and every task
   completes, or is explicitly escalated. Never settle for "N of M repos done" unless the user
   explicitly approved dropping scope; record any such approval and repeat it in the final report.
7. **Never modify the internal behavior of orchestrated skills** — sub-processes run stock
   `ss-coding-workflow`.
8. **The security boundary is external** — run only on a trusted dev machine or container. Don't
   rely on any agent's internal sandbox for isolation across nested processes (this has known gaps
   across vendors); protection comes from feature branches, PR review, and branch protection.

## Input Type Detection

| Input | Detection | Handling |
|-------|-----------|----------|
| Master plan | `docs/plans/*-master.md`, header has a `**Repos:**` table | Skip planning; go straight to execution |
| Requirement / PRD / issue | Anything else (link, text, non-master file) | Run the planning stage first, producing a master plan |
| Hand-off from a single-repo workflow | Invoked with artifact paths and detection evidence | Probe artifacts, reuse them, continue from the first missing stage |

## Pre-flight Checks (execution stage)

Run before spawning any sub-process. Any unmet check defaults to asking the user, not
terminating.

| Check | Trigger condition | Ask the user (default) | Autonomous default |
|-------|--------------------|-------------------------|---------------------|
| Repo paths valid | A repo entry's local path is missing, not a git repo, or its remote doesn't match | [give the correct path]/[clone it]/[remove this repo from scope, with explicit confirmation] | Abort and report — the orchestrator must never decide to drop a repository on its own |
| Repo has project configuration | The target repo has no project-instructions file for AI agents | [set it up there first]/[continue without it, degraded] | Continue degraded; flag the repo in the final report |
| Clean working tree, fresh default branch | `git status` in that repo is non-empty, or its default branch is behind its remote | [stash/commit then continue]/[skip updating this repo] | Stash, then continue; flag in the report |
| Sub-process CLI available | The chosen agent CLI isn't installed | [install then continue]/[choose a different CLI]/[abort] | Abort and report |
| PR-hosting CLI available in each repo | Neither `gh` nor `glab` works there | Same options as the other workflows | Continue; that sub-repo skips delivery and reports "branch ready, open the PR manually" |

**Repository location convention:** the master plan's local-path column is authoritative. When
planning generates it, paths are probed as siblings of the current repo (`../<repo-name>`);
anything unresolvable is asked about, never guessed.

## Resume Detection

| Stage | Completion check | On hit |
|-------|-------------------|--------|
| Planning (proposal) | Hand-off provided a proposal path, or a recent match exists | Reuse, skip |
| Planning (master plan) | Input is a master plan, or a recent match exists for this requirement | Reuse, skip planning |
| Per-repo execution | Sub-repo's branch already has an open PR | Mark repo done, collect its PR link, don't respawn |
| Per-repo partial | Sub-repo plan has some tasks already checked off | Respawn with resume semantics (see Failure Handling) rather than from scratch |

## Process

1. **Pre-flight and repo location.**
2. **Planning stage** *(only when the input is not a master plan)* — run in this session, since
   planning needs the global view and no process nesting is involved:
   1. For large requirements, draft a proposal with `ss-proposal`
      (with its own approval gate, skippable via skip-gates). The proposal's repo list feeds the
      master plan.
   2. Run `ss-plan` — its scope check detects the multi-repo span and produces the **master
      plan plus per-repo sub-plans**. Shared API contract changes are handled inside the proposal/
      build-plan flow as usual (contract-first: provider repos land in earlier batches).
   3. If `ss-plan` does *not* produce a master plan (single repo after all), tell the user
      this is single-repo work and hand back to `ss-coding-workflow`/`ss-feature-workflow`.
3. **Gate: multi-repo execution confirmation** — default on; skip-gates bypasses it. Changing code
   in N repositories at once is a large blast radius, so show and pause for approval on:
   - the repository list with local paths and remotes;
   - batches and dependency order;
   - per-repo sub-plan task counts;
   - the number of parallel sub-processes and the agent CLI/flags to be used;
   - detection evidence, when arrived via hand-off.

   Options: **continue / adjust (edit the master plan, then re-show) / abort**.
4. **Distribute sub-plans** — copy each repo's sub-plan into that repo's plan directory, keeping a
   descriptive, slug-based filename. The plan travels with the repo's PR — reviewable and
   traceable. The master plan stays in the originating repo.
5. **Spawn a batch** — for each repo in the current batch, start a background sub-process using
   the template below. Defaults: **at most 3 concurrent repos per batch** (each sub-process may
   itself spawn several implementer subagents — count the total against machine and API rate
   limits; split a larger batch into sub-batches), **per-repo timeout of 60 minutes** (both
   overridable by asking, or by the autonomous defaults). Log each sub-process to its own file and
   poll for completion (exit code plus log growth); treat a timeout as a failure.
6. **Monitor and collect** — parse each finished sub-process's log for the structured result block
   `ss-coding-workflow` emits (see its "Process" section, step 6). Judge completion on three
   signals together: **exit code + result block + timeout**. A sub-process that exits without a
   result block counts as failed (keep its log).

   **Failure handling, per repo:**
   1. Read the log tail; classify the cause.
   2. Auto-resumable (transient error, missing context the orchestrator can supply) → resume, at
      most twice, by continuing that sub-process's session with a corrective instruction.
   3. Not auto-resolvable (blocked, root-cause ambiguity, permission denial) → **pause the
      workflow and escalate to the user** with that repo's log summary and the status of every
      other repo. Repos already running in the same batch keep going to completion — never kill
      healthy work.
   4. A repo the user decides to abandon must be recorded as an approved scope reduction and
      flagged in the final report.
7. **Repeat** for remaining batches once the current one fully succeeds (or the user accepts a
   partial result and unblocked later batches can proceed).
8. **Converge:**
   1. **Cross-link PRs** — for every PR created, update its description to list every sibling PR
      link plus a reference to the master plan.
   2. **Consolidated report:**

      ```markdown
      ## Multi-Repo Execution Report

      | Repo | Branch | PR | Review Verdict | Tests | Tasks |
      |---|---|---|---|---|---|
      | payment-service | feat/refund-6297 | https://github.com/example/payment-service/pull/456 | APPROVED | 18 passed @def456 | 3/3 |
      | order-service | feat/refund-6297 | https://github.com/example/order-service/pull/123 | APPROVED | 42 passed @abc123 | 5/5 |

      ## Needs Human Sign-off
      (collected from each sub-process's manual-verification checklist, grouped by repo)

      ## Suggested Merge Order
      1. payment-service #456 (API provider, batch 1)
      2. order-service #123 (batch 2)

      ## User-Approved Scope Reductions
      (none / listed one by one, quoting the user's own words)
      ```

## Sub-Process Invocation

Each sub-process is a fresh, non-interactive run of the chosen agent CLI, with its working
directory set to the target repo, executing something equivalent to:

```
Run ss-coding-workflow on docs/plans/<sub-plan-file> in mode=<full|lite>, deciding
autonomously, using branch <unified-branch-name>.
```

Practical requirements, regardless of which CLI you use:

- **Non-interactive/headless mode** — the CLI's flag for running a single prompt to completion
  without an interactive session (names vary by CLI; check its docs).
- **Auto-approve edits** — a sub-process has nobody to approve individual file edits or shell
  commands; without an unattended-approval flag it will stall. Enable this only in a trusted
  environment, and only pass the stronger "skip all permission checks" variant when the user
  explicitly opted in.
- **Network access** — if the CLI's sandbox blocks outbound network by default, the sub-process
  needs it enabled to push branches and open PRs.
- **Closed or redirected stdin** — a headless run that tries to read from an interactive stdin can
  hang; redirect it from `/dev/null` or an empty input.
- **Output captured to a per-repo log file** — this orchestrator reads that log to find the
  structured result block and to diagnose failures.

The unified branch name (`$BRANCH`) comes from the master plan; passing it explicitly to
`ss-coding-workflow` in every sub-process is what makes every repository use the same branch name.

**A note on isolation:** don't rely on the sub-process's own sandbox as a security boundary when
several agent sessions are nested (subagents inside a sub-process inside this orchestrator) — this
has known gaps across vendors. Treat the trusted-machine/container boundary in Iron Rule 8 as the
real protection.

## Edge Cases & Error Handling

| Situation | Handling |
|-----------|----------|
| Input empty | Ask for a master plan path, PRD, or requirement |
| Master plan's repo table has only one row | Not multi-repo; hand back to `ss-coding-workflow` |
| `ss-plan` produced no master plan | Single-repo work; hand back |
| Repo path unresolvable and the user is unreachable (fully autonomous run) | Abort and report — never drop a repo autonomously |
| Unified branch name already exists in a repo with unrelated commits | Ask: reuse / new suffix / abort; autonomous default: create a suffixed branch and record it |
| Sub-process hangs (log stalls, no exit) | Kill at the timeout, treat as failed, keep the log |
| Partial batch success, escalation declined ("continue anyway") | Continue later batches only for repos that don't depend on the failed one; the failed repo and its dependents stay blocked and appear in the report |
| No PR-hosting CLI in a repo | That sub-repo still codes and pushes its branch; report lists "PR pending, create manually" for it |

## Examples

```
Run ss-multi-repo-workflow on docs/plans/2026-07-03-refund-master.md
Run ss-multi-repo-workflow on https://your-tracker.example/issues/PROJ-6297, deciding autonomously
Run ss-multi-repo-workflow with "refund flow spanning the order and payment services", fully autonomous, using the Codex CLI for sub-processes
```
