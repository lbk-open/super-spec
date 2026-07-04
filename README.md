# super-spec

> Spec-driven development toolkit for AI coding agents.

super-spec packages battle-tested engineering workflows as portable
[Agent Skills](https://agentskills.io): end-to-end feature workflows, multi-agent
TDD coding and parallel code review, living specs that evolve with your code, and
guardrails that keep AI-generated code safe and correct.

Works with **Claude Code**, **OpenAI Codex**, **Pi**, and **OpenCode** — one
`SKILL.md` source, no per-platform builds.

## Highlights

- **End-to-end workflows** — feature development, coding, and troubleshooting
  orchestrated from requirement to pull request, with human gates at the decisions
  that matter and resumability when a session dies mid-flight.
- **Full and lite delivery modes** — run the whole branch → PR ceremony, or work
  in place on the current branch and finish with clean conventional commits.
  Quality gates are identical in both modes.
- **Multi-agent coding & review** — TDD implementation dispatched to parallel
  subagents, then a multi-dimensional review panel (quality, spec compliance,
  integration) with severity-based verdicts.
- **Living specs** — OpenSpec-style delta specs that evolve alongside the code:
  write → archive → trace, plus reverse-engineering a baseline from an existing repo.
- **Guardrails, not style rules** — security red lines, review standards, testing
  principles, and anti-mistake rules for AI agents (core + per-language). Never
  copied into your project; read by skills at runtime.

## Installation

### Claude Code

```
/plugin marketplace add liyue2008/super-spec
/plugin install super-spec@super-spec
```

Skills appear as `/ss-*` commands (e.g., `/ss-feature-workflow`).

### OpenAI Codex, Pi, and OpenCode

All three discover skills from `~/.agents/skills/`:

```bash
git clone https://github.com/liyue2008/super-spec.git
mkdir -p ~/.agents/skills
cp -R super-spec/skills/* ~/.agents/skills/
```

Project-scoped install works too: place the same content under `<repo>/.agents/skills/`.
OpenCode additionally reads `~/.config/opencode/skills/` and `.opencode/skills/` if you
prefer those locations.

## Skill catalog

| Category | Skills |
|---|---|
| Living specs | `ss-write-spec`, `ss-archive`, `ss-list-changes`, `ss-show-spec`, `ss-trace-spec`, `ss-reverse-spec` |
| Proposals & planning | `ss-write-proposal-be`, `ss-write-proposal-fe`, `ss-build-plan`, `ss-build-api` |
| Workflows | `ss-feature-workflow`, `ss-coding-workflow`, `ss-troubleshooting-workflow`, `ss-multi-repo-workflow` |
| Multi-agent | `ss-multi-agent-coding`, `ss-multi-agent-cr` |
| Git delivery | `ss-create-branch`, `ss-create-pr`, `ss-cleanup` |
| Diagnostics | `ss-inspect`, `ss-explore-environment` |
| Shared | `ss-guardrails` (safety/quality/anti-error checklists), `ss-feedback` (file an issue) |

## Quick start

Ask your agent to run the workflow that matches the job:

- *"Use ss-feature-workflow to implement this requirement: …"* — proposal → plan →
  multi-agent coding → review → PR, with gates in between.
- *"Use ss-coding-workflow in lite mode on this plan"* — code and review on the
  current branch, no PR ceremony.
- *"Use ss-troubleshooting-workflow: production alert says …"* — evidence-based
  root-cause analysis, fix, and delivery.

Or invoke any skill directly — each `SKILL.md` documents its inputs and steps.

## Design documentation

| Doc | What it covers |
|---|---|
| [architecture.md](docs/architecture.md) | Design philosophy, one-source/four-runtimes layout, skill catalog |
| [workflows.md](docs/workflows.md) | Workflow orchestration, gates, full/lite modes, resumability |
| [multi-agent.md](docs/multi-agent.md) | Multi-agent TDD and parallel review design |
| [spec-driven.md](docs/spec-driven.md) | Living specs: delta → archive → trace |
| [worktree-and-multi-repo.md](docs/worktree-and-multi-repo.md) | Parallel-work isolation and multi-repo orchestration |
| [guardrails.md](docs/guardrails.md) | Why guardrails cover only safety, quality, and anti-error rules |

## Contributing

Issues and PRs welcome. The fastest way to report a problem from inside your agent:
run the `ss-feedback` skill. Repository conventions live in [AGENTS.md](AGENTS.md).

## License

[Apache-2.0](LICENSE)
