# super-spec — Repository Guide

super-spec is a spec-driven development toolkit for AI coding agents. It ships a set of
skills (Agent Skills / SKILL.md, see agentskills.io) that work across Claude Code,
OpenAI Codex, Pi, and OpenCode, plus engineering guardrails and design docs.

## Layout

- `skills/` — the single source of truth. Every skill lives in `skills/ss-<name>/SKILL.md`.
  - `skills/ss-guardrails/` — security / quality / anti-error checklists (core + per-language),
    read by other skills at runtime via sibling relative paths (`../ss-guardrails/core.md`).
    Guardrails are never copied into user projects.
  - `skills/_references/` — shared prompt/reference templates used across workflow,
    proposal, spec, and multi-agent skills (referenced as `../_references/<file>.md`).
- `docs/` — design documentation (architecture, workflows, multi-agent, spec-driven,
  worktree & multi-repo, guardrails rationale).
- `.claude-plugin/` — Claude Code plugin and marketplace manifests; the repo root is the plugin.

## Conventions

- All content is written in native English.
- Skill names use the `ss-` prefix, lowercase with hyphens; the directory name must match
  the `name` field in SKILL.md frontmatter.
- SKILL.md frontmatter stays portable: `name` and `description` only — no
  platform-specific fields.
- Cross-skill references use sibling relative paths so the layout works identically in
  this repo and after installation into `~/.agents/skills/`.
- Workflows support two delivery modes: `full` (branch → develop → PR) and `lite`
  (work on the current branch, finish with conventional commits). Quality gates are
  identical in both modes.
- Never introduce references to private infrastructure, internal hostnames, or
  company-specific systems.
- Keep `version` in sync across `.claude-plugin/plugin.json`,
  `.codex-plugin/plugin.json`, and `package.json` when releasing.
