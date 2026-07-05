# super-spec — Repository Guide

super-spec is a spec-driven development toolkit for AI coding agents, shipped as
portable [Agent Skills](https://agentskills.io) (SKILL.md) that work across Claude
Code, OpenAI Codex, Pi, and OpenCode from a single source — no per-platform builds.

This is a prompt/documentation repository: there is no application code, build step,
or test suite. "Correctness" here means valid manifests, resolvable cross-references,
and skills whose instructions match the documented design.

## Verification commands

```bash
claude plugin validate .                   # Claude Code plugin + marketplace manifests
ls skills | grep -c '^ss-'                 # skill count — INSTALL.md asserts this number
grep -rn 'ss-<old-name>' skills docs *.md  # after any rename/delete: zero dangling refs
```

End-to-end discovery checks (optional, used before releases):

```bash
claude plugin marketplace add ./ && claude plugin install super-spec@super-spec
cp -R skills /tmp/x/.agents/skills && cd /tmp/x && opencode debug skill   # lists ss-*
```

## Architecture

### One source, four runtimes

`skills/ss-<name>/SKILL.md` is the single source of truth. Each platform consumes it
through its own manifest, all committed at the repo root:

- **Claude Code** — `.claude-plugin/plugin.json` + `marketplace.json`; the repo root
  *is* the plugin, skills auto-discovered.
- **Codex** — `.codex-plugin/plugin.json` + `.agents/plugins/marketplace.json`; the
  repo doubles as a Codex plugin marketplace.
- **Pi** — `package.json` (`keywords: ["pi-package"]`, `"pi": {"skills": ["./skills"]}`).
- **OpenCode** — no package manager; users install via `npx skills` or copy into a
  discovery path.

Keep `version` in sync across all three plugin manifests when releasing.
`INSTALL.md` is the agent-executable install/upgrade/uninstall walkthrough.

### Skill layout and cross-references

- One skill = one directory = one `SKILL.md`. Names use the `ss-` prefix, lowercase
  with hyphens; the directory name must equal the frontmatter `name`.
- Frontmatter stays portable: `name` and `description` only. No `$ARGUMENTS`
  placeholders, no platform-specific fields or tool names — use an "Inputs" section
  and generic tool descriptions ("spawn a subagent").
- Cross-skill file references use **sibling relative paths** (`../ss-guardrails/core.md`,
  `../_references/<file>.md`) because installs copy `skills/*` flat into
  `~/.agents/skills/` — the sibling layout must survive that copy. Refer to other
  skills by name ("run the `ss-plan` skill"), never by slash-command syntax.
- `skills/ss-guardrails/` holds the safety/quality/anti-error checklists (core.md +
  7 per-language files), read by other skills at runtime. `skills/_references/` holds
  shared templates used across workflow, proposal, spec, and multi-agent skills.

### Orchestration model

- The three workflows (`ss-feature-workflow`, `ss-coding-workflow`,
  `ss-troubleshooting-workflow`) are **thin orchestrators**: they only call other
  skills, pause at human gates, and resume from artifacts. `ss-feature-workflow`
  triages complexity first — complex requirements go through `ss-proposal` and its
  approval gate, simple ones straight to `ss-plan`.
- `ss-coding` runs its own post-coding review via `ss-code-review`; workflows drive
  acceptance from the returned verdict and must never invoke review a second time.
- Delivery modes: `full` (ss-create-branch → … → ss-create-pr → ss-cleanup) and
  `lite` (work in place, finish with conventional commits). Quality gates are
  identical in both; mode is asked per run, never persisted into the user's project.
- `ss-multi-repo-workflow` orchestrates one headless `ss-coding-workflow` per repo.

### Cross-file interface contracts (grep before changing)

These exact strings couple producers to consumers — renaming one side silently
breaks detection logic:

- `**Repositories Involved:**` (produced by ss-proposal templates; consumed by
  `_references/multi-repo-detection.md` and the workflows)
- `**Repositories Requiring Fix:**` (produced by ss-inspect's report)
- `---SS-RESULT---` result block (ss-coding-workflow → ss-multi-repo-workflow)

## Hard rules

- **Non-intrusion.** Skills never write toolkit files into a user's project. User
  work products (the `openspec/` tree, proposals, plans) are the exception; touching
  a project-owned file such as the user's `AGENTS.md` requires their explicit consent.
  Guardrails are read in place, never copied out.
- **All content is native English**, imperative voice for instructions. Generated
  artifacts follow the standard policy: match the project's existing docs language,
  default to English.
- Never introduce references to private infrastructure, internal hostnames, or
  company-specific systems.

## Documentation sync

Skill changes drift docs fast. After adding/renaming/removing a skill, sweep:

- `docs/` — `architecture.md` (layout tree + skill catalog) and whichever of
  workflows / multi-agent / spec-driven / worktree-and-multi-repo / guardrails
  describes the changed behavior
- `README.md` **and** `README.zh-CN.md` (they mirror each other; update both)
- `INSTALL.md` — the expected `ss-*` count appears in its verify steps

README.zh-CN.md formatting: a bold span ending with a CJK period needs a space
after the closing `**` (`**…。** 文字`), or CommonMark renders the delimiter
literally.
