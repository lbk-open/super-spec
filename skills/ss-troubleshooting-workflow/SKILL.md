---
name: ss-troubleshooting-workflow
description: End-to-end defect fix — takes an issue link, alert ID, or problem description and orchestrates root-cause investigation, human confirmation, branching, a fix plan, multi-agent coding with built-in review, and PR/commit delivery. Use only when the user explicitly asks for the full diagnose-to-delivery pipeline, not for diagnosis alone.
---

# Troubleshooting Workflow

Chains the existing `ss-*` skills into a single diagnose-fix-deliver flow:

```
ss-inspect → [Gate: root-cause confirmation] → ss-create-branch
→ ss-build-plan → ss-multi-agent-coding (built-in review) → review-acceptance loop → ss-create-pr
```

**Core principle: thin orchestration.** This skill never writes code or drafts a plan itself. It
calls the other skills in order, pauses at the gates below, passes each step's output to the
next, and reports progress.

> **Review is not run twice.** `ss-multi-agent-coding` already enforces a post-coding review
> internally and returns a verdict. This workflow never invokes `ss-multi-agent-cr` separately —
> the review-acceptance loop below is driven entirely by that verdict.

Unlike `ss-feature-workflow`, the root-cause report from `ss-inspect` replaces the proposal, and
**root cause is confirmed before any branch is created** — worth fixing is established before
code is touched.

## When to Run

This is heavy, end-to-end orchestration: it runs a root-cause investigation, creates a branch,
spawns coding agents, runs reviews, and delivers the fix. Only run it when the user explicitly
asks for this skill or clearly wants the full diagnose-to-delivery pipeline. For a plain question
or a diagnosis-only request, do the work directly (or point to `ss-inspect` for diagnosis alone).

## Inputs

- **Problem source** — an issue link, alert ID, or plain-text problem description. If missing,
  ask for one.
- **Delivery mode** — `full` (default) or `lite`. See "Delivery Mode" below.
- **Skip-gates** — proceed through the root-cause confirmation gate without pausing (not
  recommended — see Iron Rule 2).
- **Decide-autonomously** — resolve ambiguous choices without asking.
- **Worktree preference** — forwarded to `ss-create-branch`.

## Delivery Mode: full vs. lite

The quality gates — root-cause confirmation, TDD, multi-agent code review, verification — are
identical in both modes. Only the start and finish of the *fix* change:

| | `full` (default) | `lite` |
|---|---|---|
| Start | `ss-create-branch` cuts a fix branch (optionally a worktree) | Skipped — develop in place on the current branch |
| Finish | `ss-create-pr` opens a pull/merge request | Skipped — finish with a conventional-commits commit (push optional) and print a change summary |
| Cleanup | `ss-cleanup` removes the branch/worktree after merge | Not applicable |

Mode resolution: an explicit mode input wins; otherwise ask once at the start and use that answer
for the rest of the run. Never persist the choice to a project config file.

## Multi-Repo Routing

Cross-service defects — service A errors, root cause lives in service B, or the fix spans both —
are a frequent multi-repo case. This workflow checks at three points. Full rules in
`../_references/multi-repo-detection.md` (this table is a condensed copy; the reference file wins
on conflict).

| Level | Signal | Action |
|---|---|---|
| Deterministic | `ss-build-plan` produced a **master plan** (`*-master.md` with a `**Repos:**` table of more than one row) | Hand off to `ss-multi-repo-workflow` — no question when deciding autonomously |
| High confidence | The root-cause report's `**Repositories Requiring Fix:**` list has more than one entry | Offer hand-off at the root-cause gate; autonomous mode hands off |
| Heuristic | The issue/alert description explicitly requires committing fixes in two or more services/repos | Ask, showing the evidence; autonomous mode hands off |
| Exclusions | Shared API-contract repo, spec/standards submodules, services merely mentioned as callers/context with no code change, multiple modules inside one repository | Not multi-repo signals |

**Judgment points:**

1. **Entrance, before pre-flight** — scan the issue/alert text for the heuristic signal. On a
   hit, ask (or decide autonomously) and hand off with the original input.
2. **Root-cause gate** — the most reliable point: by the end of the investigation, affected repos
   are part of the evidence chain. When the report's repo list has more than one entry, the gate
   gains an extra option: switch to `ss-multi-repo-workflow` (the recommended default in that
   case). Hand off with the root-cause report as the planning input.
3. **After build-plan** — a safety net for a mis-scoped root-cause report: if `ss-build-plan`'s
   scope check still detected a cross-repo span and produced a master plan, hand off with it —
   deterministic, no question asked under autonomous mode.

On hand-off: pass the original input, the root-cause report and any other artifacts, and the
active automation flags to `ss-multi-repo-workflow`; print one line explaining the hand-off and
terminate this workflow.

## Iron Rules

Violating any of these means stopping and explaining to the user:

1. **The orchestrator does no real work** — only call other `ss-*` skills; never edit source or
   draft plans directly.
2. **The root-cause-confirmation gate is on by default and critical** — a wrong root cause causes
   full rework, so a human must confirm it (skip-gates mode can bypass this, but it isn't
   recommended).
3. **Pre-flight checks ask, they don't abort** — apply the autonomous default only when deciding
   autonomously.
4. **No gate for review — run the loop instead** — see "Review-Acceptance Loop". There is also no
   gate before delivery.
5. **Resumable** — on start, probe for existing artifacts and skip completed steps.
6. **Never relax safety guardrails** — automation flags only affect questions and approvals; they
   never bypass the hard rules built into the underlying skills.

## Pre-flight Checks

Run once on start. Any unmet check defaults to asking the user, not terminating.

| Check | Trigger condition | Ask the user (default) | Autonomous default |
|-------|--------------------|-------------------------|---------------------|
| Problem source reachable | Input is a URL and no tool is configured to fetch it | [describe how to fetch it]/[switch to a text description]/[abort] | Cannot read the source → abort and report |
| PR-hosting CLI available | Neither `gh` nor `glab` is installed/authenticated | [install/authenticate then continue]/[continue but skip `ss-create-pr`]/[abort] | Continue; skip `ss-create-pr`, prompt to deliver manually |
| Branch state | Still on the trunk/default branch when entering coding | [create a branch first]/[code on the current branch]/[abort] | Auto-invoke `ss-create-branch`, then continue |

> Whether the investigation needs environment/observability access is decided by `ss-inspect`
> itself — pure code analysis needs none of that.

## Resume Detection

| Step | Completion check | On hit |
|------|-------------------|--------|
| `ss-inspect` | A root-cause conclusion was already produced this session, or `docs/troubleshooting/` has a recent (within 24h) report | List it and ask whether to reuse (autonomous mode reuses the most recent) |
| `ss-create-branch` | Current branch is not the trunk/default branch, or a worktree already exists for this issue's branch | Reuse the branch; switch into the worktree if applicable |
| `ss-build-plan` | `docs/plans/` has a structured plan | Reuse, skip |
| `ss-multi-agent-coding` | Every task in the plan is checked off | Skip coding, go straight to the review-acceptance loop |
| `ss-create-pr` | The branch already has an open PR | Report the existing PR link and finish |

## Process

1. **Pre-flight and resume.**
2. **`ss-inspect`** — locate the root cause through a multi-source evidence chain, cross-verifying
   with at least two independent sources. Record the conclusion and its evidence.
3. **Gate: root-cause confirmation** — show the conclusion and evidence; pause for **continue to
   fix / re-investigate / abort**, plus **switch to multi-repo workflow** when the repo list has
   more than one entry (recommended default in that case). This step requires human confirmation
   — a wrong root cause reworks everything downstream. Skip-gates mode bypasses it (not
   recommended). "Re-investigate" gathers more evidence or changes direction, then confirms again.
   Cap re-investigation at 2 rounds; beyond that, explain the evidence gap and offer "abort with a
   note" or "continue to fix anyway" rather than retrying indefinitely.
4. **`ss-create-branch`** *(full mode only)* — branch from the issue input, prefix defaulting to
   `fix/`. Forward the worktree preference. Record the branch name and worktree path.
5. **`ss-build-plan`** — draft the fix plan from the root-cause conclusion (including any spec
   delta). If it produced a master plan, hand off to `ss-multi-repo-workflow` and stop.
6. **`ss-multi-agent-coding`** — execute the fix plan. It already covers TDD and test
   verification, and enforces its own post-coding review before returning a verdict.
7. **Review-acceptance loop** — drive acceptance from the verdict (below) until it passes or the
   remaining findings are judged invalid.
8. **Delivery** *(full mode)* — call `ss-create-pr`, referencing the original issue in the PR
   description; report the link, plus a reminder that `ss-cleanup` removes the worktree and
   branch after merge. *(lite mode)* — commit with a conventional-commits message referencing the
   issue (push optional), then print a summary.

## Review-Acceptance Loop

After `ss-multi-agent-coding` returns its verdict, this workflow sets no gate and does not pause:

1. Read the verdict.
2. No unresolved findings (approved) → go to delivery.
3. Unresolved findings remain → judge each one: **valid** goes on the to-fix list; **invalid**
   (false positive, out of scope, by design, or suggestion-only) is recorded with a reason and
   left unfixed.
   - **Scope-reduction findings get no leniency**: a finding reporting unimplemented requirements,
     stubbed logic presented as complete, or scope silently deferred ("phase 2", "MVP",
     "simplified for now") must never be judged invalid as "by design" or "out of scope" unless
     the user explicitly approved that scope adjustment earlier — cite that approval.
4. All judged invalid → treat as passed (with the judgment record) and go to delivery.
5. Valid findings remain → call `ss-multi-agent-coding` again for just those findings → back to
   step 1.

**Convergence protection:**
- Cap workflow-level rounds at 3, independent of `ss-multi-agent-coding`'s internal rounds; if
  exceeded, escalate with the latest verdict plus the fixed/unresolved lists.
- Track recurrence at the workflow level: the same finding judged valid across 2 consecutive
  workflow rounds after being "fixed" is a stall — escalate.
- Record every "invalid" judgment and its reason. Never force a finding to "invalid" just to pass.

## Edge Cases & Error Handling

| Situation | Handling |
|-----------|----------|
| Input empty | Ask for an issue link, alert ID, or problem description |
| `ss-inspect` cannot pin down a root cause (insufficient evidence) | Stop at the confirmation gate, explain the gap, don't force a fix |
| Diagnosis concludes "not a defect / expected behavior" | Report the conclusion, don't create a branch or fix, finish |
| Coding is blocked | Stop, escalate, preserve the scene |
| Review-acceptance loop exceeds max rounds | Escalate |
| No PR-hosting CLI, user chose "continue" | Stop before delivery, prompt to deliver manually |
| Worktree creation fails | `ss-create-branch` falls back to in-place development automatically; record and continue |
| User chooses "abort" at any step | Stop, report progress and artifact paths |

## Examples

```
Run ss-troubleshooting-workflow on https://your-tracker.example/issues/PROJ-7150
Run ss-troubleshooting-workflow with "staging: user login returns 500", deciding autonomously
Run ss-troubleshooting-workflow on ALERT-20260626-001 in lite mode
```
