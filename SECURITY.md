# Security Policy

## What SuperSpec is

SuperSpec ships no application code. It is a set of Agent Skills — Markdown
instructions (`SKILL.md`) that an AI coding agent reads and executes. There is no
runtime, no server, and no binary. The security surface is therefore the
*instructions themselves*, and the permissions your agent already has.

Two properties are load-bearing, and a report that shows either is violated is a
security bug:

- **Skills never write toolkit files into your project.** The only files SuperSpec
  produces are your own work products — the `openspec/` tree, proposals, plans.
  Guardrails and templates are read in place, never copied out.
- **Skills never contact private infrastructure.** No telemetry, no phone-home, no
  hardcoded hosts.

## Supported versions

Only the latest released version receives fixes. See
[Releases](https://github.com/lbk-open/super-spec/releases).

## Reporting a vulnerability

Report privately through GitHub's
[security advisory form](https://github.com/lbk-open/super-spec/security/advisories/new).
Please do not open a public issue for anything exploitable.

Include what you would for any bug: the skill involved, the instruction that
misbehaves, and what an agent following it would do. If you can, quote the exact
lines from `SKILL.md`.

Expect an acknowledgement within a few days. Fixes ship in the next release; you
will be credited in the changelog unless you prefer otherwise.

## What counts

In scope:

- Instructions that would lead an agent to exfiltrate secrets, weaken a project's
  security posture, or run destructive commands without a gate.
- Prompt-injection paths — content a skill reads (a spec, a proposal, an issue
  body) that could redirect the agent's behavior.
- Guardrail rules that are wrong in a way that makes generated code unsafe.
- Anything that writes into a user's project against the non-intrusion rule above.

Out of scope:

- The agent platforms themselves (Claude Code, Codex, Pi, OpenCode) — report those
  upstream.
- Code that an agent generates while following a skill. Review it as you would any
  code; that is what the guardrails and the review panel are for.
