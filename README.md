# SuperSpec

English | [简体中文](README.zh-CN.md) · [Apache-2.0 license](LICENSE)

Portable Agent Skills for feature delivery, coding, root-cause investigation,
independent review and OpenSpec-compatible living specs. One prompt bundle works
with Claude Code, Codex, Pi and OpenCode; no workflow runtime engine to install.

## Install from npm/Pi or a checkout

The established npm/Pi distribution is `@lbk-open/super-spec`; the source checkout
keeps the local package name `super-spec`. See [INSTALL.md](INSTALL.md) for Pi
package installation, local plugins and manual copies, with explicit platform/scope
consent. The [Pi gallery entry](https://pi.dev/packages/@lbk-open/super-spec) and
previous npm release 0.1.1 establish the channel, not availability of 0.2.0: check
the registry's actual version before installing a particular release. Then request:

- Use ss-feature-workflow to implement this requirement.
- Use ss-coding-workflow in lite mode on this approved plan.
- Use ss-troubleshooting-workflow to investigate and repair this issue.

Install all 20 ss-* directories side by side, including ss-references and
ss-guardrails. Project/global discovery changes require consent; workflows don't
install dependencies or globally configure agents as a recovery shortcut.

## How delivery works

One continuous owner investigates, plans, codes and fixes each shared boundary.
Main coordinates and arbitrates; children inherit actual parent model. The owner
uses focused behavioral RED -> minimum GREEN -> refactor/regression. Fresh
read-only independent review precedes a single retained final full verifier.
Missing review or real test failures block completion; accepted fixes return to
the same owner with fresh impact review and retained revalidation.

Proposal plus applicable delta is complete/validated BEFORE proposal approval.
Repairs first confirm evidence-backed root cause; restoring an unchanged promise
may justify no-delta with authoritative evidence. Prebranch work uses a protected
external staged mirror. Reuse short plans, materialize identical approved bytes,
and archive/rebase before review. Complete required commits before review only with
existing Git authorization; PR delivery must use the already proven committed identity,
otherwise report local delivery. Review, full tests and delivery bind actual current
inputs including HEAD/index/diff, not merely file bytes. Publication never commits,
repairs or rebases the proven candidate.

Flags are invocation-only: --auto/-a completes eligible policy gates, never
fabricated human approval; --decide/-d chooses bounded options but skips no gate.
--worktree/-w and --no-worktree/-W select authorized workspace. Combined -adw/-daW
are supported; conflicting -wW stops. Preserve flags, human/auto/pending gate state,
scope and workspace through handoffs/recovery in one protected external checkpoint.
Unknown live writers block replacement; no automatic CLI/model/protocol fallback.

Full ends at actual PR creation or honest local delivery under user restrictions;
lite ends locally with identical quality. Neither permits automatic merge, deploy,
release, destructive cleanup or new scope. Multi-repo coordination requires real
native cwd/delegation/terminal-result capabilities and explicit dependencies.

## Skill catalog

| Skill | Purpose |
| --- | --- |
| [ss-feature-workflow](skills/ss-feature-workflow/SKILL.md) | Requirement through proposal/spec gate and delivery |
| [ss-coding-workflow](skills/ss-coding-workflow/SKILL.md) | Approved plan through verified delivery |
| [ss-troubleshooting-workflow](skills/ss-troubleshooting-workflow/SKILL.md) | RCA gate through repair and delivery |
| [ss-multi-repo-workflow](skills/ss-multi-repo-workflow/SKILL.md) | Dependency-aware repository coordination |
| [ss-proposal](skills/ss-proposal/SKILL.md) | Architecture, API/UI contracts and applicable delta |
| [ss-plan](skills/ss-plan/SKILL.md) | Reusable short behavior/interface/test-intent map |
| [ss-inspect](skills/ss-inspect/SKILL.md) | Report-only evidence-backed investigation |
| [ss-coding](skills/ss-coding/SKILL.md) | Continuous-owner TDD, review and retained validation |
| [ss-code-review](skills/ss-code-review/SKILL.md) | Fresh read-only causal-impact review |
| [ss-create-branch](skills/ss-create-branch/SKILL.md) | Safe authorized workspace preparation |
| [ss-create-pr](skills/ss-create-pr/SKILL.md) | Publish only an already proven candidate |
| [ss-cleanup](skills/ss-cleanup/SKILL.md) | Separately authorized exact-path cleanup |
| [ss-write-spec](skills/ss-write-spec/SKILL.md) | Strict OpenSpec delta authoring |
| [ss-archive](skills/ss-archive/SKILL.md) | Authorized pre-review authoritative spec merge |
| [ss-show-spec](skills/ss-show-spec/SKILL.md) | Read current capability specs |
| [ss-trace-spec](skills/ss-trace-spec/SKILL.md) | Trace requirements to source |
| [ss-list-changes](skills/ss-list-changes/SKILL.md) | Read active/archive change inventory |
| [ss-reverse-spec](skills/ss-reverse-spec/SKILL.md) | Derive baseline specs from actual source |
| [ss-guardrails](skills/ss-guardrails/SKILL.md) | Shared safety/quality and language checks |
| [ss-references](skills/ss-references/SKILL.md) | Shared policy/templates, not a standalone workflow |

## Documentation and validation

- [Workflow order and flags](docs/workflows.md)
- [Roles, waiting and recovery](docs/multi-agent.md)
- [Workspaces and multiple repositories](docs/worktree-and-multi-repo.md)
- [Living specs](docs/spec-driven.md) · [Guardrails](docs/guardrails.md)
- [Architecture](docs/architecture.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)
- Checkout only: `AGENTS.md` (repository guide), `RELEASING.md` (release boundaries)

The npm bundle includes skills, documentation, local plugin manifests and the Codex
icon, not Git history, repository instructions, tests or release tooling. Use a full
repository checkout for development and release work; the existing GitHub v0.2.0 tag
is not the repaired npm candidate's source identity (see checkout `RELEASING.md`).

Repository validation uses `./scripts/validate.sh` in that checkout; Node runs
static prompt-contract and weakening tests, not a live agent/native execution proof. Workflow execution
needs no Node helper. Native discovery/installation and host behavior require their
own authorized verification; missing tools are disclosed, never called passes.
