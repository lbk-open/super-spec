# SuperSpec

English | [简体中文](README.zh-CN.md)

[![CI](https://img.shields.io/github/actions/workflow/status/lbk-open/super-spec/ci.yml?branch=main&label=ci)](https://github.com/lbk-open/super-spec/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/lbk-open/super-spec?label=release)](https://github.com/lbk-open/super-spec/releases)
[![License](https://img.shields.io/github/license/lbk-open/super-spec)](LICENSE)
[![npm](https://img.shields.io/npm/v/@lbk-open/super-spec?label=npm)](https://www.npmjs.com/package/@lbk-open/super-spec)
[![skills.sh](https://skills.sh/b/lbk-open/super-spec)](https://skills.sh/lbk-open/super-spec)
[![Works with Claude Code · Codex · Pi · OpenCode](https://img.shields.io/badge/Works_with-Claude_Code_%C2%B7_Codex_%C2%B7_Pi_%C2%B7_OpenCode-6E56CF)](https://github.com/lbk-open/super-spec)

> A set of spec-driven Agent Skills — one command takes a feature or a fix all the way to production-ready code.

SuperSpec packages battle-tested engineering workflows as portable
[Agent Skills](https://agentskills.io): end-to-end feature workflows, multi-agent
TDD coding and parallel code review, living specs that evolve with your code, and
guardrails that keep AI-generated code safe and correct.

Works with **Claude Code**, **OpenAI Codex**, **Pi**, and **OpenCode** — one
`SKILL.md` source, no per-platform builds. It draws on ideas from two projects we
admire, [superpowers](https://github.com/obra/superpowers) and
[OpenSpec](https://github.com/Fission-AI/OpenSpec), and stays fully compatible with
the OpenSpec directory convention.

## Quick start

Let your agent install SuperSpec for you — paste this into any agent session
(Claude Code, Codex, Pi, OpenCode, …):

```
Install SuperSpec by following the instructions here:
https://raw.githubusercontent.com/lbk-open/super-spec/main/INSTALL.md
```

Then ask your agent to run the workflow that matches the job:

- *"Use ss-feature-workflow to implement this requirement: …"* — complexity triage →
  proposal (complex requirements only) → plan →
  multi-agent coding → review → PR, with human gates in between.
- *"Use ss-coding-workflow in lite mode on this plan"* — code and review on the
  current branch, no PR ceremony.
- *"Use ss-troubleshooting-workflow: production alert says …"* — evidence-based
  root-cause analysis, fix, and delivery.

Or invoke any skill directly — each `SKILL.md` documents its inputs and steps.

## Installation

**Recommended: let an AI agent install it.** [INSTALL.md](INSTALL.md) is written for an
agent to execute — platform selection, copying, verification, and collision checks
included. Paste this into your agent session:

```
Install SuperSpec by following the instructions here:
https://raw.githubusercontent.com/lbk-open/super-spec/main/INSTALL.md
```

Prefer doing it by hand? The short version:

- **Claude Code** — `/plugin marketplace add lbk-open/super-spec`, then
  `/plugin install super-spec@super-spec`. Skills appear as `/ss-*` commands.
- **OpenAI Codex** — `codex plugin marketplace add https://github.com/lbk-open/super-spec`,
  then `codex plugin add super-spec@super-spec`. Update with
  `codex plugin marketplace upgrade super-spec`.
- **Pi** — `pi install npm:@lbk-open/super-spec` (no version pin). Update with
  `pi update --all`.
- **OpenCode** — `npx skills add lbk-open/super-spec -a opencode`. Update with
  `npx skills update`.
- **Manual fallback (Codex / Pi / OpenCode)** — copy `skills/*` into `~/.agents/skills/`
  (all three scan it), keeping every `ss-*` directory side by side — including the
  `ss-guardrails` and `ss-references` libraries the other skills read at runtime.
  Project-scoped: `<repo>/.agents/skills/`.

Full details, upgrade, and uninstall steps: [INSTALL.md](INSTALL.md).

## Why SuperSpec

- **Production-ready output, even off frontier models.** The pipeline — spec →
  plan → TDD implementation → parallel multi-dimensional review → guardrails —
  is designed to extract dependable code from mid-tier models, rather than betting
  on a single top-tier model getting everything right in one shot.
- **The model runs the workflow, not a tool.** Workflows are markdown instructions
  the agent itself executes: thin orchestration, human gates, resumability. There
  is no orchestrator CLI, state machine, or code generator to install — if your
  agent can read a skill, it can run the whole pipeline, and adapt it when reality
  diverges from the happy path.
- **End-to-end, not snippets.** Feature development, coding, and troubleshooting
  are covered from requirement to pull request, with gates at the decisions that
  matter and the ability to resume when a session dies mid-flight.
- **Full and lite delivery modes.** Run the whole branch → PR ceremony, or work in
  place on the current branch and finish with clean conventional commits. Quality
  gates are identical in both modes.
- **Multi-agent coding & review.** TDD implementation dispatched to parallel
  subagents, then a review panel (quality, spec compliance, integration) with
  severity-based verdicts and a bounded fix loop.
- **Living specs, OpenSpec-compatible.** Delta specs that evolve alongside the
  code — write → archive → trace — following the [OpenSpec](https://github.com/Fission-AI/OpenSpec)
  convention (`openspec/specs`, `openspec/changes`, archive lifecycle). A repo
  initialized by the OpenSpec CLI works with SuperSpec's spec skills as-is, and
  vice versa.
- **Guardrails, not style rules.** Security red lines, review standards, testing
  principles, and anti-mistake rules for AI agents (core + per-language). Never
  copied into your project; read by skills at runtime.

## How it works

What actually happens when the key skills run:

### Development

- **`ss-proposal`** — reads the requirement or PRD, filters it down to this
  repository's boundary, studies the existing architecture and conventions, then
  writes a high-level design proposal to `docs/proposals/`: architecture and data
  flow, key interfaces, alternatives with trade-offs, risks, milestones. A
  self-review pass (plus an independent reviewer when available) gates the result.
- **`ss-plan`** — decomposes a proposal or requirement into an executable
  task plan: first it generates OpenSpec delta specs as the acceptance baseline,
  then breaks the work into dependency-ordered tasks, each small enough to
  implement and verify test-first. The plan file doubles as persistent state for
  resuming later.
- **`ss-coding`** — reads the plan, groups independent tasks, and dispatches them
  to parallel implementer subagents. Each subagent gets the full task text, the
  relevant delta specs, and the guardrails pasted into its prompt, and works
  test-first. When all tasks land, it runs the test suite, invokes
  `ss-code-review`, and loops on the fix list until the verdict is APPROVED —
  then reports a test-verified commit plus a manual acceptance checklist.
- **`ss-code-review`** — fans the diff out to parallel reviewers with distinct
  lenses: general code quality, compliance with guardrails and project specs, and
  cross-module integration. Findings are confidence-filtered, deduplicated, and
  merged into a severity-rated verdict (APPROVED / NEEDS_CHANGES /
  CRITICAL_ISSUES) with a structured fix list that `ss-coding` can act on.

### Troubleshooting

- **`ss-inspect`** — staged, evidence-driven root-cause analysis: pin down the
  symptom, gather evidence from multiple sources (logs, traces, metrics, code,
  git history), form competing hypotheses, and try to falsify them — reproducing
  the failure where possible — before writing a root-cause report with a
  recommended fix and the repositories requiring changes.

### Workflows

- **`ss-feature-workflow` / `ss-coding-workflow`** — thin orchestration over the
  skills above: branch → complexity triage → proposal + *[approval gate]* (complex
  requirements; simple ones go straight to plan) → plan → coding with built-in
  review → PR. `ss-coding-workflow` is the shorter path that starts
  from an existing plan or a direct change instruction, skipping the proposal
  stages. Both support full and lite delivery modes and resume from artifacts if
  a session dies mid-flight.
- **`ss-troubleshooting-workflow`** — runs `ss-inspect` first, holds at a
  root-cause confirmation gate, and only then cuts a branch and drives the fix
  through the same coding-and-review path.
- **`ss-multi-repo-workflow`** — for changes spanning repositories: splits the
  work per repo, launches a headless agent process in each (running
  `ss-coding-workflow`), schedules them in dependency batches, and aggregates the
  per-repo results into one report. The orchestrator never edits code itself.

### Git delivery

- **`ss-create-branch`** — derives a typed branch name (`feat/`, `fix/`, …) from
  the requirement and cuts it from the default branch — optionally in an isolated
  **git worktree** (explicit request > repo convention > ask once), so the branch
  gets its own directory: the main checkout stays clean, parallel tasks don't
  trample each other, and an interrupted run leaves nothing dirty behind. It uses
  your agent's native worktree tooling when available, falling back to a
  git-ignored `.worktrees/` directory in the project.
- **`ss-create-pr`** — runs the quality gates first (tests, lint, leftover-debris
  scan), writes conventional commits, detects the forge from the remote (`gh` for
  GitHub, `glab` for GitLab), and opens a PR with a description generated from
  the plan and specs. No remote or no CLI? It degrades to local commits plus a
  change summary — not a failure.
- **`ss-cleanup`** — after the merge: removes the branch and worktree, syncs the
  default branch, and exits fast when there's nothing to clean (lite mode).

## Skill catalog

| Category | Skills |
| --- | --- |
| Living specs | `ss-write-spec`, `ss-archive`, `ss-list-changes`, `ss-show-spec`, `ss-trace-spec`, `ss-reverse-spec` |
| Proposals & planning | `ss-proposal`, `ss-plan` |
| Workflows | `ss-feature-workflow`, `ss-coding-workflow`, `ss-troubleshooting-workflow`, `ss-multi-repo-workflow` |
| Multi-agent | `ss-coding`, `ss-code-review` |
| Git delivery | `ss-create-branch`, `ss-create-pr`, `ss-cleanup` |
| Diagnostics | `ss-inspect` |
| Shared libraries | `ss-guardrails` (safety/quality/anti-error checklists), `ss-references` (templates other skills read at runtime) |

## How it compares

These projects share the same goal — making AI-written code trustworthy — but
emphasize different layers. They're complementary more than competing; the notes
below describe the differences, not a ranking.

| Project | Primary focus | How it differs from SuperSpec |
| --- | --- | --- |
| [superpowers](https://github.com/obra/superpowers) | A rich library of process skills (brainstorming, TDD, debugging, subagent-driven development) that instill working discipline | Focuses on *how to work* at the practice level; SuperSpec adds spec lifecycle management, end-to-end delivery workflows (requirement → PR), and per-language guardrails. Claude Code-first with adapters for other agents; SuperSpec ships one SKILL.md source for four runtimes |
| [OpenSpec](https://github.com/Fission-AI/OpenSpec) | Spec change management: a CLI and conventions for proposing, approving, and archiving spec deltas | Manages *what to build* and leaves implementation to your agent; SuperSpec adopts its spec convention (fully compatible) and adds the execution half — planning, multi-agent coding, review, and delivery |
| [spec-kit](https://github.com/github/spec-kit) | Spec-driven development driven by the `specify` CLI: constitution → specify → plan → tasks templates across many agents | Workflow advances through CLI-generated templates and scripts; SuperSpec keeps orchestration in prompts executed by the model itself, layers in multi-agent review and guardrails, and is built around living specs that outlive a single feature |

If you already use OpenSpec, SuperSpec plugs into the same `openspec/` directory.
If you use superpowers, the two skill sets coexist under the same agent without
conflict — the `ss-` prefix keeps names disjoint.

## Design documentation

| Doc | What it covers |
| --- | --- |
| [architecture.md](docs/architecture.md) | Design philosophy, one-source/four-runtimes layout, skill catalog |
| [workflows.md](docs/workflows.md) | Workflow orchestration, gates, full/lite modes, resumability |
| [multi-agent.md](docs/multi-agent.md) | Multi-agent TDD and parallel review design |
| [spec-driven.md](docs/spec-driven.md) | Living specs: delta → archive → trace |
| [worktree-and-multi-repo.md](docs/worktree-and-multi-repo.md) | Parallel-work isolation and multi-repo orchestration |
| [guardrails.md](docs/guardrails.md) | Why guardrails cover only safety, quality, and anti-error rules |

## Acknowledgements

SuperSpec stands on the shoulders of two excellent open-source projects:
[superpowers](https://github.com/obra/superpowers) pioneered packaging engineering
discipline as agent skills, and [OpenSpec](https://github.com/Fission-AI/OpenSpec)
defined the spec-delta convention this toolkit builds on. If SuperSpec isn't the
right fit, go check them out.

## Contributing

Issues and PRs welcome. Repository conventions live in [AGENTS.md](AGENTS.md).

## Uninstall

- **Claude Code**

  ```
  /plugin uninstall super-spec@super-spec
  /plugin marketplace remove super-spec
  ```

- **Codex** — `codex plugin remove super-spec`, then optionally
  `codex plugin marketplace remove super-spec`.
- **Pi** — `pi remove npm:@lbk-open/super-spec`.
- **Manual copies (Codex / Pi / OpenCode)** — remove exactly what the install copied
  (adjust the path if you installed project-scoped or to an OpenCode alternate location):

  ```bash
  rm -rf ~/.agents/skills/ss-*
  ```

SuperSpec keeps no state outside the skills directory and never writes into your
projects, so there is nothing else to clean up. Details: [INSTALL.md](INSTALL.md#uninstalling).

## License

[Apache-2.0](LICENSE)
