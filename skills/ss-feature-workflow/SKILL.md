---
name: ss-feature-workflow
description: End-to-end feature delivery — takes a PRD, requirement description, or requirement doc link and orchestrates branch creation, technical proposal, execution plan, multi-agent coding with built-in review, and PR/commit delivery. Use only when the user explicitly asks for the full feature pipeline, not for a single edit or question.
---

# Feature Workflow

Chains the existing `ss-*` skills into one requirement-to-delivery pipeline:

```
ss-create-branch → ss-proposal → [Gate: proposal approval]
→ ss-plan → ss-coding (built-in review) → review-acceptance loop → ss-create-pr
```

**Core principle: thin orchestration.** This skill never writes code or drafts a proposal/plan
itself. It calls the other skills in order, pauses at the gates below, passes each step's output
to the next, and reports progress. Every step's logic stays owned by its own skill.

> **Review is not run twice.** `ss-coding` already enforces a post-coding review
> internally (with its own fix rounds) and returns a verdict. This workflow never invokes
> `ss-code-review` separately — the review-acceptance loop below is driven entirely by the
> verdict `ss-coding` returns.

## When to Run

This is heavy, end-to-end orchestration: it creates a branch, writes a proposal, spawns multiple
coding agents, runs reviews, and opens a PR. Only run it when the user explicitly asks for this
skill or clearly wants the full feature pipeline. For an ordinary edit, a question, or a
single-step request, do the work directly (or point to the one relevant `ss-*` skill) — only
mention this workflow if the user might want the full pipeline.

## Inputs

- **Requirement source** — a PRD/requirement document link, a plain-text requirement
  description, or a local requirement file. If missing, ask for one before proceeding.
- **Delivery mode** — `full` (default) or `lite`. See "Delivery Mode" below.
- **Skip-gates** — proceed through the proposal-approval gate without pausing.
- **Decide-autonomously** — resolve ambiguous choices without asking, instead of pausing for
  clarification.
- **Worktree preference** — develop in an isolated worktree, or in place. Forwarded to
  `ss-create-branch`; omit to let it decide or ask.

## Delivery Mode: full vs. lite

The quality gates in the middle of this pipeline — proposal review, TDD, multi-agent code
review, verification — are identical in both modes. Only the start and finish change:

| | `full` (default) | `lite` |
|---|---|---|
| Start | `ss-create-branch` cuts a feature branch (optionally a worktree) | Skipped — develop in place on the current branch |
| Finish | `ss-create-pr` opens a pull/merge request | Skipped — finish with a conventional-commits commit (push optional) and print a change summary |
| Cleanup | `ss-cleanup` removes the branch/worktree after merge | Not applicable |

Mode resolution: an explicit mode input wins; otherwise ask once when the workflow starts and use
that answer for the rest of the run. Never write the choice to a config file in the user's
project — ask again next time.

## Multi-Repo Routing

A feature's multi-repo nature may be visible up front, or only surface once the proposal or plan
is drafted — this workflow checks at three points. Full rules and hand-off protocol live in
`../_references/multi-repo-detection.md` (this table is a condensed copy; the reference file
wins on conflict).

| Level | Signal | Action |
|---|---|---|
| Deterministic | `ss-plan` produced a **master plan** (`*-master.md` with a `**Repos:**` table of more than one row) | Hand off to `ss-multi-repo-workflow` — no question when deciding autonomously |
| High confidence | The proposal's `**Repositories Involved:**` list has more than one entry | Ask at the proposal gate; autonomous mode hands off |
| Heuristic | The requirement/PRD explicitly requires committing code in two or more services/apps/repos; both backend and frontend are needed and this repo covers only one side | Ask, showing the evidence; autonomous mode hands off |
| Exclusions | Shared API-contract repo, spec/standards submodules, read-only mentions of other services, multiple modules inside one repository | Not multi-repo signals |

**Judgment points:**

1. **Entrance, before pre-flight** — scan the input text/PRD for the heuristic signal. On a hit,
   ask (or decide autonomously) and hand off with the original input.
2. **Proposal gate** — when the proposal's repo list has more than one entry, the gate gains an
   extra option: switch to `ss-multi-repo-workflow` (the recommended default in that case). Hand
   off with the proposal and the branch already created.
3. **After build-plan** — if a master plan was produced, hand off with it; this is deterministic,
   no question asked under autonomous mode.

On hand-off: pass the original input, artifacts produced so far (branch, proposal, plans), and
the active automation flags; print one line explaining the hand-off and terminate this workflow.
`ss-multi-repo-workflow` reuses those artifacts through its own resume detection.

## Iron Rules

Violating any of these means stopping and explaining to the user:

1. **The orchestrator does no real work** — only call other `ss-*` skills; never edit source
   directly, never draft proposals or plans directly.
2. **Pre-flight checks ask, they don't abort** — when a check fails, ask the user how to proceed
   instead of stopping outright. When deciding autonomously, apply the default below without
   pausing.
3. **The proposal-approval gate is on by default** — after the proposal is drafted, pause for
   approval; skip-gates mode skips it.
4. **No gate for review — run the loop instead** — `ss-coding` has built-in review;
   after it returns, if unresolved valid findings remain, automatically re-invoke coding without
   pausing (see "Review-Acceptance Loop"). There is also no gate before delivery.
5. **Resumable** — on start, probe for existing artifacts and skip completed steps.
6. **Never relax safety guardrails** — automation flags only affect questions and approvals; they
   never bypass the hard rules built into `ss-coding` or `ss-create-pr` (repeated-
   failure escalation, scope-overreach rejection, secret detection, force-push confirmation, etc.).

## Pre-flight Checks

Run once on start. Any unmet check defaults to asking the user, not terminating. When deciding
autonomously, apply the "Autonomous default" column without pausing.

| Check | Trigger condition | Ask the user (default) | Autonomous default |
|-------|--------------------|-------------------------|---------------------|
| Requirement source reachable | Input is a URL and no tool is configured to fetch it | [describe how to fetch it]/[switch to a local file or pasted text]/[abort] | Cannot read the source → abort and report (the only hard failure point) |
| PR-hosting CLI available | Neither `gh` nor `glab` is installed/authenticated for this repo's remote | [install/authenticate then continue]/[continue but skip `ss-create-pr` at the end, deliver manually]/[abort] | Continue; skip `ss-create-pr` and report "branch is ready, open the PR manually" |
| Branch state | Still on the trunk/default branch when entering coding (only happens on resume, or when branch creation failed) | [create a branch first]/[code on the current branch]/[abort] | Auto-invoke `ss-create-branch`, then continue |

> Starting on the trunk branch is fine — the first step, `ss-create-branch`, cuts a new branch
> from it. The branch check only matters on resume or after a failed branch creation.

## Resume Detection

On start, probe for existing artifacts and skip completed steps:

| Step | Completion check | On hit |
|------|-------------------|--------|
| `ss-create-branch` | Current branch is not the trunk/default branch, or a worktree already exists for this requirement's branch | Reuse the branch; if it lives in a worktree, switch into it |
| Proposal | `docs/proposals/` has a recent file matching this requirement | Reuse it; if unsure, list candidates and ask (autonomous mode picks the most recent) |
| `ss-plan` | `docs/plans/` has a structured plan (contains task/file sections) | Reuse, skip |
| `ss-coding` | Every task in the plan is checked off | Skip coding, go straight to the review-acceptance loop |
| `ss-create-pr` | The branch already has an open PR | Report the existing PR link and finish |

## Process

1. **Pre-flight and resume** — run the checks above and skip completed steps.
2. **`ss-create-branch`** *(full mode only)* — cut the branch from the requirement input; skip in
   lite mode. The branch-type prefix (feat/fix/...) is decided by `ss-create-branch` itself.
   Forward the worktree preference if given. Record the branch name and worktree path (if any).
3. **Proposal** — run `ss-proposal` on the requirement. It produces a stack-neutral,
   high-level design proposal covering whichever parts of the system the requirement
   touches. Output goes to `docs/proposals/`.
4. **Gate: proposal approval** — show the proposal summary and path; pause for **continue /
   revise / abort**, plus **switch to multi-repo workflow** when the repo list has more than one
   entry. Skip-gates mode continues automatically, but if the repo list still has more than one
   entry, ask this one question anyway — continuing single-repo would silently drop scope.
   "Revise" regenerates or adjusts per feedback, then confirms again. Cap revisions at 2; beyond
   that, suggest refining the proposal separately before restarting the workflow.
5. **`ss-plan`** — generate the execution plan from the proposal (including any delta spec).
   If it produced a master plan, hand off to `ss-multi-repo-workflow` and stop.
6. **`ss-coding`** — execute the plan. It already covers TDD, spec-compliance checks,
   and test verification, and enforces its own post-coding review before returning a verdict.
7. **Review-acceptance loop** — drive acceptance from the verdict (below) until it passes or the
   remaining findings are judged invalid.
8. **Delivery** *(full mode)* — call `ss-create-pr` to archive any delta spec, rebase, and open the
   PR; report the link, target branch, and status, plus a reminder that `ss-cleanup` removes the
   worktree and branch after merge. *(lite mode)* — commit with a conventional-commits message
   (push optional), then print a summary of files changed, tests run, and the review verdict.

## Review-Acceptance Loop

After `ss-coding` returns its verdict, this workflow sets no gate and does not pause —
it drives acceptance automatically:

1. Read the verdict.
2. No unresolved findings (approved) → go to delivery.
3. Unresolved findings remain → judge each one: **valid** (genuinely needs fixing) goes on the
   to-fix list; **invalid** (false positive, out of scope, by design, or suggestion-only) is
   recorded with a reason and left unfixed.
   - **Scope-reduction findings get no leniency**: a finding reporting unimplemented requirements,
     stubbed logic presented as complete, or scope silently deferred ("phase 2", "MVP",
     "simplified for now") must never be judged invalid as "by design" or "out of scope" unless
     the user explicitly approved that scope adjustment earlier — cite that approval in the
     judgment record.
4. All judged invalid → treat as passed (with the judgment record) and go to delivery.
5. Valid findings remain → call `ss-coding` again for just those findings (it re-codes
   and reruns review internally) → back to step 1.

**Convergence protection:**
- Cap workflow-level rounds at 3 (independent of `ss-coding`'s internal rounds). If
  exceeded with valid findings still unresolved, stop and escalate with the latest verdict plus
  the fixed/unresolved lists.
- Track recurrence at the workflow level: if the same finding is still judged valid after being
  "fixed" across 2 consecutive workflow rounds, treat it as a stall and escalate. Don't rely on
  `ss-coding`'s internal counter — it resets every call.
- Record every "invalid" judgment and its reason in the execution summary, for the reviewer to
  double-check. Never force a finding to "invalid" just to pass.

## Edge Cases & Error Handling

| Situation | Handling |
|-----------|----------|
| Input empty | Ask for a requirement link, description, or file path |
| Proposal stage lacks information | The proposal skill asks on its own; this workflow passes it through |
| `ss-plan` produces an empty plan | Report "empty plan", stop, return to the user |
| Coding is blocked (repeated failures or scope overreach) | Stop, escalate, preserve the scene |
| Review-acceptance loop exceeds max rounds | Escalate (see Convergence protection) |
| No PR-hosting CLI, user chose "continue" | Stop before delivery, prompt to open the PR manually |
| Worktree creation fails | `ss-create-branch` falls back to in-place development automatically; record the fallback and continue |
| User chooses "abort" at any step | Stop, report progress and artifact paths |

## Examples

```
Run ss-feature-workflow on https://your-tracker.example/issues/PROJ-6297
Run ss-feature-workflow with "Add order-refund support for full and partial refunds", deciding autonomously
Run ss-feature-workflow on docs/requirements/refund.md in lite mode
```
