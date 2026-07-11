---
name: ss-coding-workflow
description: Executes a ready-made plan or a plain-language change instruction end to end — branch, multi-agent coding with built-in review, and PR/commit delivery. Use for running an existing execution plan or a simple, well-scoped code change; use ss-feature-workflow instead when a proposal and plan still need to be drafted.
---

# Coding Workflow

Chains the existing `ss-*` skills into a single execute-and-deliver flow:

```
ss-create-branch → ss-coding (built-in review) → review-acceptance loop → ss-create-pr
```

**Core principle: thin orchestration.** This skill never writes code itself. It calls the other
skills in order, passes outputs along, and reports progress.

> **Review is not run twice.** `ss-coding` already enforces a post-coding review
> internally and returns a verdict. This workflow never invokes `ss-code-review` separately —
> the review-acceptance loop below is driven entirely by that verdict.

Unlike `ss-feature-workflow`, there is no proposal or planning step here, and no manual gate by
default — the input is either an already-prepared plan or a change instruction handed straight to
coding.

## When to Run

This is end-to-end orchestration: it creates a branch, spawns coding agents, runs reviews, and
delivers the result. Only run it when the user explicitly asks for this skill or clearly wants the
full execute-to-delivery pipeline. For an ordinary edit, a question, or a single-step request, do
the work directly (or point to the one relevant `ss-*` skill).

## Inputs

- **Execution input**, one of:
  - a path to an existing execution plan (produced by `ss-plan`), or
  - a plain-language change instruction (e.g., "extract OrderService's helper methods into
    OrderUtils").
  If ambiguous which one it is, ask; when deciding autonomously, treat text with a recognizable
  task/file structure as a plan, otherwise as a change instruction.
- **Delivery mode** — `full` (default) or `lite`. See "Delivery Mode" below.
- **Explicit branch name** (optional) — used verbatim by `ss-create-branch`, skipping name
  derivation. Set this when a caller (such as `ss-multi-repo-workflow`) needs one unified branch
  name across repositories.
- **Skip-gates** / **decide-autonomously** — kept for consistency with the other workflows; this
  workflow has no gate by default, so skip-gates has little effect here.
- **Worktree preference** — forwarded to `ss-create-branch`.

## Delivery Mode: full vs. lite

The quality gates — TDD, multi-agent code review, verification — are identical in both modes.
Only the start and finish change:

| | `full` (default) | `lite` |
|---|---|---|
| Start | `ss-create-branch` cuts a branch (optionally a worktree) | Skipped — develop in place on the current branch |
| Finish | `ss-create-pr` opens a pull/merge request | Skipped — finish with a conventional-commits commit (push optional) and print a change summary |
| Cleanup | `ss-cleanup` removes the branch/worktree after merge | Not applicable |

Mode resolution: an explicit mode input wins; otherwise ask once at the start and use that answer
for the rest of the run. Never persist the choice to a project config file.

## Multi-Repo Routing

Checked once, before pre-flight — this workflow's input *is* the plan, so multi-repo nature is
fully decidable at the entrance. Full rules in `../ss-references/multi-repo-detection.md` (this
table is a condensed copy; the reference file wins on conflict).

| Level | Signal | Action |
|---|---|---|
| Deterministic | Input is a master plan (`*-master.md` with a `**Repos:**` table of more than one row), or a plan set with multiple `**Repo:**` sub-plans | Hand off to `ss-multi-repo-workflow` — no question when deciding autonomously |
| High confidence | The plan's file paths escape the current repo root (`../other-repo/...`, or absolute paths outside it) | Ask, showing the paths; autonomous mode hands off |
| Heuristic | The change instruction explicitly requires committing code in two or more repositories | Ask, showing the evidence; autonomous mode hands off |
| Exclusions | Shared API-contract repo, spec/standards submodules, read-only mentions of other services, multiple modules inside one repository | Not multi-repo signals |

On hand-off: pass the original input, any existing artifacts, and the active automation flags to
`ss-multi-repo-workflow`; print one line explaining the hand-off and terminate this workflow.

## Iron Rules

Violating any of these means stopping and explaining to the user:

1. **The orchestrator does no real work** — only call other `ss-*` skills; never edit source
   directly.
2. **Pre-flight checks ask, they don't abort** — apply the autonomous default only when deciding
   autonomously.
3. **No gate for review — run the loop instead** — see "Review-Acceptance Loop". There is also no
   gate before delivery.
4. **Resumable** — on start, probe for existing artifacts and skip completed steps.
5. **Never relax safety guardrails** — automation flags only affect questions and approvals; they
   never bypass the hard rules built into the underlying skills.

## Pre-flight Checks

Run once on start. Any unmet check defaults to asking the user, not terminating.

| Check | Trigger condition | Ask the user (default) | Autonomous default |
|-------|--------------------|-------------------------|---------------------|
| Requirement/plan source reachable | Input is a URL and no tool is configured to fetch it | [describe how to fetch it]/[switch to a local file or pasted text]/[abort] | Cannot read the source → abort and report |
| PR-hosting CLI available | Neither `gh` nor `glab` is installed/authenticated | [install/authenticate then continue]/[continue but skip `ss-create-pr`]/[abort] | Continue; skip `ss-create-pr`, prompt to deliver manually |
| Branch state | Still on the trunk/default branch when entering coding | [create a branch first]/[code on the current branch]/[abort] | Auto-invoke `ss-create-branch`, then continue |

> No source-fetching tool is needed when the input is a local plan file or plain text — the check
> only triggers for a URL input, same as the other workflows.

## Resume Detection

| Step | Completion check | On hit |
|------|-------------------|--------|
| `ss-create-branch` | Current branch is not the trunk/default branch, or a worktree already exists for this task's branch | Reuse the branch; switch into the worktree if applicable |
| `ss-coding` | Every task in the input plan is checked off | Skip coding, go straight to the review-acceptance loop |
| `ss-create-pr` | The branch already has an open PR | Report the existing PR link and finish |

## Process

1. **Pre-flight and resume**, then detect the input type (plan vs. change instruction).
2. **`ss-create-branch`** *(full mode only)*:
   - If an explicit branch name was given, use it verbatim and skip derivation.
   - Otherwise name the branch from the plan title, or from the change instruction's summary with
     a prefix that matches its nature (refactor → `refactor/`, small feature → `feat/`, small fix
     → `fix/`); ask if ambiguous. Forward the worktree preference. Record the branch name and
     worktree path.
3. **`ss-coding`** — full execution for a plan input; inline fast mode (handles small,
   low-file-count changes without a full plan) for a change instruction. It already covers TDD and
   test verification, and enforces its own post-coding review before returning a verdict.
4. **Review-acceptance loop** — drive acceptance from the verdict (below) until it passes or the
   remaining findings are judged invalid.
5. **Delivery** *(full mode)* — call `ss-create-pr` to archive any delta spec, rebase, and open the
   PR; report the link, plus a reminder that `ss-cleanup` removes the worktree and branch after
   merge. *(lite mode)* — commit with a conventional-commits message (push optional), then print a
   summary of files changed, tests run, and the review verdict.
6. **Structured result block** — always end the final report with this block. `ss-multi-repo-workflow`
   parses it when this workflow runs as a headless sub-process; in ordinary interactive use it is
   just a few extra lines:

   ```
   ---SS-RESULT---
   status: SUCCESS | FAILED | BLOCKED
   branch: <branch-name>
   delivery: <pr-url | local-commit | none>
   review_verdict: <APPROVED | ...>
   test_verified_ref: <commit-ish | none>
   tasks_completed: <N/N>
   blocker: <one-line reason when status is not SUCCESS, else omit>
   ---END-SS-RESULT---
   ```

   Emit exactly one block, as the last thing in the final message. `status: SUCCESS` requires
   either an open PR or an explicit "delivered as local commit" decision, plus all tasks
   completed. Every escalation/abort path emits the block too, with `FAILED`/`BLOCKED` and
   `blocker` filled in.

## Review-Acceptance Loop

After `ss-coding` returns its verdict, this workflow sets no gate and does not pause:

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
5. Valid findings remain → call `ss-coding` again for just those findings → back to
   step 1.

**Convergence protection:**
- Cap workflow-level rounds at 3, independent of `ss-coding`'s internal rounds; if
  exceeded, escalate with the latest verdict plus the fixed/unresolved lists.
- Track recurrence at the workflow level: the same finding judged valid across 2 consecutive
  workflow rounds after being "fixed" is a stall — escalate. Don't rely on
  `ss-coding`'s internal counter; it doesn't accumulate across calls.
- Record every "invalid" judgment and its reason. Never force a finding to "invalid" just to pass.

## Edge Cases & Error Handling

| Situation | Handling |
|-----------|----------|
| Input empty | Ask for a plan path, plan text, or change instruction |
| Plan is missing a file list | Incomplete plan; report and stop |
| Change instruction is too large (`ss-coding` estimates more than ~5 tasks or ~5 files) | Suggest switching to `ss-feature-workflow` for full planning; ask whether to continue anyway |
| Coding is blocked | Stop, escalate, preserve the scene |
| Review-acceptance loop exceeds max rounds | Escalate |
| Worktree creation fails | `ss-create-branch` falls back to in-place development automatically; record and continue |
| No PR-hosting CLI, user chose "continue" | Stop before delivery, prompt to deliver manually |

## Examples

```
Run ss-coding-workflow on docs/plans/2026-06-26-refund.md
Run ss-coding-workflow with "Extract OrderService's helper methods into OrderUtils"
Run ss-coding-workflow with "Add 2-decimal-place amount validation to /api/refund", deciding autonomously
```
