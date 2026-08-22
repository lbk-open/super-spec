# Isolating parallel work: worktrees and multi-repo orchestration

## The problem

An agent-driven workflow eventually runs into the same limitation a human developer hits: one working copy can only be on one branch at a time. Left unaddressed, that constraint shows up in two related but distinct ways.

**Within a single repository**, developing in place means checking out the feature branch directly in the main working copy. That blocks anything else that would want to touch the same checkout: you can't glance at the default branch, you can't pick up an urgent second task, and a workflow that gets interrupted mid-task leaves a dirty working copy that the next task has to fight through. Nothing manages the lifecycle of an isolated workspace end to end — creating one is a manual step, and cleaning one up after the fact is easy to forget.

**Across repositories**, a single requirement or bug fix can legitimately span more than one codebase — a backend service and its consuming frontend, or two services on either side of an API contract. A workflow built to orchestrate one repository doesn't generalize to that case just by adding more file access: giving an agent read/write access to a second repo's directory doesn't load that repo's own configuration, its own project conventions, or its own spec baseline. Everything that makes an agent behave correctly in a given repo is scoped to that repo, and bolting on a second directory doesn't carry any of it along.

This document covers both problems, because they share a root cause — a single working context isn't enough once more than one thing needs to happen at once — and because the same skills (`ss-create-branch`, `ss-cleanup`) show up in the solution to each.

---

## Part 1 — Worktree isolation within a repository

### Why git worktrees

A git worktree is a second working directory attached to the same repository, checked out to a different branch, sharing the same object store. It gives a feature branch its own directory without cloning the repository again, and without ever touching the branch the main checkout happens to be on.

This is the same approach recommended by the public [`superpowers`](https://github.com/obra/superpowers) skill collection's `using-git-worktrees` guidance, and SuperSpec follows its core sequence closely: detect any isolation that already exists, prefer a host tool's native worktree support when one is available, and fall back to plain `git worktree` commands when it isn't.

### Detecting existing isolation first

Before creating anything, check whether the current session is already isolated:

1. **Is a worktree for the target branch already registered?** `git worktree list --porcelain` is the single source of truth — if the branch already has a worktree, reuse it by switching into that directory rather than creating a second one.
2. **Is the current session already inside a worktree (and not inside a submodule)?** Compare `git rev-parse --git-dir` against `git rev-parse --git-common-dir`: when they differ and the session isn't inside a submodule (submodules also report differing paths, so this check only confirms rather than rules out), the session is already isolated. If the current branch already matches the target, just keep working there; otherwise, switch branches inside that same worktree instead of nesting a new one.
3. Only after both checks come up empty does a new worktree get created.

This ordering matters: creating a worktree inside a worktree is a footgun, and reusing an existing one is almost always the right move when a branch already has a home.

### Creating a worktree

When a new worktree is genuinely needed, prefer whatever native tooling the host agent environment provides (Claude Code, for instance, has first-class worktree support that keeps the session's own notion of "current directory" in sync automatically — always prefer that over fighting the harness with raw shell commands). Where no native tool exists, fall back to plain git:

```bash
git fetch origin
git check-ignore -q .worktrees || echo '.worktrees/' >> .gitignore
git worktree add .worktrees/<flattened-branch> -b <branch> origin/<base-branch>
cd .worktrees/<flattened-branch>
```

A few conventions make this predictable:

- **Location:** `.worktrees/` at the repository root — inside the project, not a sibling directory. A sibling directory (`../repo-wt`) can silently fall outside an agent's permitted working directories, and it survives (as an orphan) if the main repo is ever deleted; a directory inside the repo does neither.
- **Naming:** slashes in the branch name get flattened to dashes — `feat/refund-precision` becomes `.worktrees/feat-refund-precision` — so the directory name maps back to the branch unambiguously without needing a separate lookup table.
- **Safety check:** confirm `.worktrees/` is actually git-ignored before creating anything under it, and add it to `.gitignore` if it isn't. That write should go in *without* being auto-committed — the main checkout is very likely still sitting on whatever branch the user was already on (often the default branch), and a silent commit there pollutes its history and can break a later fast-forward pull. Surface the pending `.gitignore` change and let the user fold it into their next commit.
- **Discovery stays stateless:** everything about which worktrees exist is derived from `git worktree list --porcelain` at query time. There's no separate manifest file to keep in sync or let drift.

### Getting the environment ready

A fresh worktree starts empty of anything git doesn't track — submodules aren't checked out, and installed dependencies aren't there. Before handing the workspace back for development:

- Initialize any submodules the project depends on (`git submodule update --init --recursive`), since project conventions, shared configuration, or spec baselines can live in one.
- Install dependencies according to the stack in play (a lockfile-driven install, a module download, or whatever the project's own build tooling expects), running anything long as a background step rather than blocking on it.
- Skip a full baseline test run by default — a worktree freshly cut from the default branch's HEAD has zero code changes in it, so the baseline is whatever the remote's CI already reports for that commit. Reserve an explicit "verify baseline first" option for cases where that remote signal isn't trusted.

### Deciding whether to use a worktree at all

Not every task needs isolation, and asking every single time gets old fast. The decision order, from most to least specific:

1. **An explicit choice on the invocation** — pass a flag to use a worktree, or a flag to develop in place, and that settles it for this run.
2. **A standing team convention** — if a project's own contributing guide documents a default (e.g., "we always work in worktrees here"), a contributor or an automated workflow can simply always pass the matching flag and never hit the next step. SuperSpec's skills don't write this convention into the project themselves; recording and following it is left to the team, the same way any other project convention is. One machine-readable way to record it is an `SS-WORKTREE` managed block in `AGENTS.md` — `ss-create-branch` looks for exactly this key:

  ```markdown
  <!-- SS-WORKTREE:START -->
  ss:worktree-default: worktree   <!-- or: in-place -->
  <!-- SS-WORKTREE:END -->
  ```
3. **Ask once** — with no explicit signal either way, ask whether this task should use an isolated worktree, and mention that a standing convention avoids the question going forward.

An unattended workflow that reaches step 3 with nobody available to answer should default to creating a worktree — isolation is the safer failure mode, and the choice gets recorded in whatever report the workflow produces.

### Lifecycle and command responsibilities

```mermaid
flowchart LR
    A["ss-create-branch\ndecide → branch → worktree → environment ready"] --> B["development, review, spec archival\n(happens inside the worktree, if one was created)"]
    B --> C["ss-cleanup\nconfirm merged → remove worktree → delete branch"]
```

| Stage | Responsibility |
|---|---|
| `ss-create-branch` | Decides whether to isolate (per the order above), creates the branch, creates the worktree if applicable, switches the session into it, and gets the environment ready. |
| Everything in between (coding, review, spec archival, opening a pull request) | Operates *inside* whatever workspace it's handed. It only needs to notice which environment it's in — it never creates or tears one down itself. |
| `ss-cleanup` | Confirms the change has actually merged, switches the session back to the main checkout, removes the worktree, and deletes the branch. |

Keeping creation and teardown concentrated in two skills, with everything else a pure "user" of whatever workspace already exists, is what keeps the lifecycle from getting tangled — a review or archival step never has to reason about whether it's safe to make or destroy a worktree, because that was already decided upstream.

### Removing a worktree safely

`ss-cleanup` removing a worktree is not a plain `git worktree remove` — worktrees that have initialized submodules refuse a bare removal, and that refusal on its own doesn't mean there's anything to lose. The distinction that matters:

- **Only the submodule is blocking removal, and the worktree itself is otherwise clean** (`git status --porcelain --ignore-submodules=none` in that directory reports nothing beyond the submodule guard): force-remove without asking — there's genuinely nothing to lose.
- **There are real uncommitted changes**, submodule-internal or otherwise: surface exactly what would be discarded and require explicit confirmation before forcing the removal. A blanket `--force` here would silently discard work with no further warning.

Before switching the main checkout back to the default branch, check that the main checkout itself is clean first. If it's dirty, don't switch silently — a plain `git checkout` carries uncommitted changes onto the target branch and then onto every subsequent branch cut from it. Report what's dirty and let the user choose to discard it, deal with it first, or skip the branch switch for now.

### Edge cases worth knowing about

| Situation | Handling |
|---|---|
| The target branch already has a worktree | Switch into it; never create a second one for the same branch |
| Currently inside a worktree, asked to start another branch | Switch branches inside the current worktree rather than nesting |
| `.worktrees/<name>` exists on disk but isn't a registered worktree (leftover from an interrupted run) | `git worktree add` will refuse and `prune` won't help — confirm with the user, then clear the directory and retry |
| Worktree creation is denied (sandboxing, permissions) | Fall back to developing in place, and say so explicitly rather than failing silently |
| `.gitignore` can't be written to | Report it and ask: fall back to in-place development, or have the user resolve it and retry |
| A worktree still has uncommitted changes at cleanup time | Require explicit confirmation (or an explicit force flag) before discarding anything |

### Where this fits relative to branch/PR delivery style

Worktree isolation is about *where* work happens — a separate directory versus the main checkout. It's an orthogonal decision from *whether* a workflow creates a branch and opens a pull request at all versus committing in place on the current branch. A task can combine either choice with either delivery style; picking to isolate doesn't imply anything about whether a pull request eventually gets opened, and vice versa.

---

## Part 2 — Orchestrating a requirement across repositories

### Why a single agent session can't just span repos

The obvious-looking shortcut — give one agent session access to two repositories' directories and let it work across both — breaks down for a structural reason, not a permissions one: a repo's own configuration (its conventions file, its spec baseline, anything that shapes how an agent should behave in that codebase) is scoped to that repo's root. Handing a session extra directory access doesn't load any of that; it only grants file access. The agent ends up working in a second codebase with none of the context that makes it behave correctly there.

A generic nested sub-agent is not automatically the answer: extra path access does not load the target repository's configuration, and many hosts cannot guarantee an independent child cwd or enough delegation depth for that child to run its own implementers and reviewers. A native child becomes a valid repository runner only when the host proves an absolute per-child cwd, fresh repository context and skills, nested delegation, observable lifecycle, structured results, and exact run identity.

### The design: one repository-scoped runner per repository

The portable abstraction is a **repository runner**, not a particular process API. When the host proves all native-child guarantees above, the runner may be a child execution unit under the parent session. Otherwise it is a fresh headless process. Either way, it starts from the target repository's real working root, runs unattended, executes the stock `ss-coding-workflow`, and reports through the same result contract.

```mermaid
flowchart TB
    subgraph orch["Orchestrating session (any directory)"]
        O["Read the master plan\nBatch by dependency order\nMonitor + collect results\nSummarize"]
    end
    subgraph repoA["Repo A — repository runner"]
        A1["real cwd = repo-a\nrun unattended"]
        A2["loads repo A's own config/spec baseline"]
        A3["spawns its own implementer/reviewer sub-agents"]
    end
    subgraph repoB["Repo B — repository runner"]
        B1["real cwd = repo-b\nrun unattended"]
        B2["loads repo B's own config/spec baseline"]
        B3["spawns its own implementer/reviewer sub-agents"]
    end
    O -->|"dispatch"| A1
    O -->|"dispatch"| B1
    A1 --> A2 --> A3
    B1 --> B2 --> B3
    A3 -->|"structured result"| O
    B3 -->|"structured result"| O
```

Because each runner really starts in its target repository, it naturally loads the correct configuration and spec baseline — the "which context applies here" problem disappears by construction. It must also retain enough delegation depth to run the same internal implementation and review fanout as an ordinary single-repository workflow.

Adapter readiness fails closed. The orchestrator proves cwd, context, nested-delegation, lifecycle, result, and exact-identity guarantees before launch; it never silently falls back mid-run. The isolation this buys is between changes, not a security sandbox. The actual safety boundary remains the surrounding trusted machine/container, branch protection, and human review.

### The orchestrator's job, and what it explicitly doesn't do

The orchestrating session is deliberately thin. It:

- Reads (or, if only a requirement description was given, first produces) a **master plan** naming every repository involved, their local paths, which batch each belongs to, and any dependency between batches.
- Presents that plan for a **go/no-go confirmation** before dispatching anything — with multiple repositories about to be changed at once, this is a stronger gate than a single-repo workflow needs, and skipping it should require an explicit opt-in, not be the default.
- Copies each repository's own slice of the plan into that repository before starting its runner — a runner should never have to reach across repository boundaries to find its own instructions.
- Launches one repository runner per repository in the current batch, running them in parallel; batches with a dependency between them run one after another, never overlapping.
- Captures an exact execution identity at launch, waits for terminal lifecycle plus a valid structured result from each runner, and checks every single one individually rather than treating "most of them succeeded" as good enough.
- On completion, produces one cross-repository summary: what shipped where, what still needs human sign-off, and a suggested merge order when one repository's change depends on another's.

What it never does: touch source code in any of the target repositories, or make an implementation decision on their behalf. Every actual line of code is written by a per-repository runner, inside its own repository, using the same review-and-verification path a single-repo change would go through.

### Ground rules the orchestrator holds itself to

- **Every runner runs unattended and does not own product decisions.** A native attention channel may surface a question to the parent; a headless process must not wait for interactive input. Human decisions happen before dispatch or after escalation.
- **Parallelism only within a batch; batches run in dependency order.** If repo B's runner consumes an API that repo A's runner is introducing, A's batch has to fully complete before B's batch starts.
- **A repository's slice of the plan is delivered to it before its runner starts** — never fetched by reaching outside its own directory.
- **Resume uses exact identity.** Capture the process session ID or native run/task ID at launch; never resume an ambiguous "latest" execution when repositories run in parallel.
- **Every repository's result is checked, not sampled.** A summary that reports overall success while quietly omitting one failing repository is worse than no summary.
- **No unauthorized scope-cutting.** If five repositories were in scope, the job isn't done until all five have shipped or a specific one has been explicitly deferred with the user's sign-off — never silently narrowed to "the ones that worked."

### Reading results back

For an orchestrator to make batch-to-batch decisions programmatically, each per-repository runner needs to end with machine-parseable evidence rather than free-form prose. The exact shared block is delimited by `---SS-RESULT---` / `---END-SS-RESULT---`; object and array values are compact JSON on one line:

```text
---SS-RESULT---
status: SUCCESS | FAILED | BLOCKED
input_identity: {"kind":"plan","path":"docs/plans/2026-07-03-refund-payment.md","problem_id":null}
branch: feat/refund-support
delivery: https://github.com/<owner>/<repo>/pull/123
delivered_ref: abc1234
review_verdict: APPROVED
test_verified_ref: abc1234
test_evidence: {"command":"./scripts/validate.sh","result":"passed","summary":"all checks passed"}
tasks_completed: 5/5
changed_files: ["src/refund.ts", "test/refund.test.ts"]
commands_run: [{"command":"./scripts/validate.sh","result":"passed","summary":"all checks passed"}]
residual_risks: []
clean_worktree: true
---END-SS-RESULT---
```

`input_identity` uses the canonical compact JSON shape defined by `ss-coding-workflow` (fixed key order; exact repo-relative POSIX plan path; exact Problem ID JSON string or `null`). For example, a troubleshooting sub-plan uses `{"kind":"plan","path":"docs/plans/fix-payment.md","problem_id":"ALERT-123"}`. `SUCCESS` is accepted only when that identity exactly matches the dispatched sub-plan, delivery exists, `delivered_ref` identifies the commit at that location, review is approved, all tasks are complete, the full verification command passed with `test_verified_ref == delivered_ref`, changed files are present, residual risks are disclosed, and the worktree is clean. Missing or contradictory evidence is failure even when surrounding prose claims success.

A `FAILED` or `BLOCKED` result triggers inspection of that runner's terminal evidence. Something transient can be worth a bounded number of exact-identity resumes; anything else pauses the workflow and escalates with the failing repository's evidence while letting healthy runners in the same batch finish.

### When a single-repo workflow discovers it isn't single-repo after all

A workflow that starts out assuming one repository doesn't always know that up front — a request can turn out to span repositories partway through scoping. Rather than teaching every single-repo workflow how to handle that case internally (which just duplicates multi-repo logic in several places and lets it drift), the right move is to **detect and hand off**: the moment a single-repo workflow recognizes cross-repository scope, it stops and transfers what it has produced so far — an already-drafted plan, an already-created branch, whatever exists — to the multi-repo workflow described above, rather than trying to muddle through it single-repo.

A rough ordering of how confidently that hand-off should be triggered:

| Confidence | Signal | Action |
|---|---|---|
| Certain | A plan explicitly names more than one repository; several sub-plans each name a different repository; or a complete, confirmed investigation report's `**Repositories Requiring Fix:**` names more than one repository | Hand off directly; confirmed investigation scope cannot be downgraded later |
| High | File paths in a plan point outside the current repository's root; a written proposal explicitly lists more than one affected repository | Ask for confirmation, then hand off |
| Heuristic | The original request names two or more services/repos by name in plain language | Ask, showing the evidence for why this looks cross-repo |
| Not a signal | A shared API-contract repository being touched separately; a documentation reference to another service without touching its code; multiple modules changing inside one repository | Stays single-repo |

Whichever workflow detects the hand-off carries along the stable original-input identity (`**Problem ID:**` for troubleshooting), every exact artifact path already produced, and the detection evidence. The multi-repo workflow reuses only artifacts linked to that identity; recency alone is insufficient.

### Mapping to the skills

| Concern | Skill |
|---|---|
| Deciding on and creating an isolated worktree for a single repository's branch | `ss-create-branch` |
| Removing a worktree and its branch once a change has shipped | `ss-cleanup` |
| Reading (or producing) a master plan, launching one repository-scoped runner per repository, batching by dependency, and rolling up results | `ss-multi-repo-workflow` |

Everything a per-repository runner does once it's running — creating its own branch, developing, running review, archiving a delta spec, opening a pull request — is the same single-repo path described elsewhere in this project, invoked with exactly the same skills a human working in that one repository would use directly. Multi-repo orchestration doesn't introduce a second implementation path; it only decides *when* and *where* to launch each copy.
