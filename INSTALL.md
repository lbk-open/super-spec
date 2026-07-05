# Installing super-spec

> **This document is written for an AI coding agent to execute.**
>
> **Human?** Paste this into your agent session (Claude Code, Codex, Pi, OpenCode, or
> any agent with shell access) and let it do the rest:
>
> ```
> Install super-spec by following the instructions here:
> https://raw.githubusercontent.com/liyue2008/super-spec/main/INSTALL.md
> ```

---

## Agent instructions

You are installing **super-spec**, a set of Agent Skills (`SKILL.md` directories with an
`ss-` prefix) from `https://github.com/liyue2008/super-spec`. Follow the steps in order.
Verify each step before moving on. If a step fails, stop and report the exact error —
do not improvise alternative install locations.

### Step 1 — Ask which platforms to install for

Ask the user (skip if they already said):

1. **Which agents?** Claude Code / OpenAI Codex / Pi / OpenCode — one or several.
2. **Scope?** Global (available in every project — the default) or project-scoped
   (this repository only).

Detect what's available to inform the question, but don't decide for the user:

```bash
for c in claude codex pi opencode; do command -v "$c" >/dev/null && echo "$c: installed"; done
```

### Step 2 — Claude Code (if selected)

Claude Code installs super-spec as a plugin; no file copying needed.

```bash
claude plugin marketplace add liyue2008/super-spec
claude plugin install super-spec@super-spec
```

**Verify:**

```bash
claude plugin list | grep -A3 super-spec
```

Expected: `super-spec@super-spec` with `Status: ✔ enabled`. Skills appear as `/ss-*`
commands in the user's next Claude Code session.

If the `claude` CLI is not on PATH, tell the user to run `/plugin marketplace add
liyue2008/super-spec` and `/plugin install super-spec@super-spec` inside a Claude Code
session instead.

### Step 3 — Codex, Pi, and/or OpenCode (if selected)

All three discover skills from the same directory. Choose the target by scope:

- **Global:** `~/.agents/skills/`
- **Project-scoped:** `<project-root>/.agents/skills/`

Copy the skills (a shallow clone into a temp dir keeps things clean):

```bash
TARGET="$HOME/.agents/skills"          # or "<project-root>/.agents/skills" for project scope
TMP="$(mktemp -d)"
git clone --depth 1 https://github.com/liyue2008/super-spec.git "$TMP/super-spec"
mkdir -p "$TARGET"
cp -R "$TMP/super-spec/skills/"* "$TARGET/"
rm -rf "$TMP"
```

**Do not rename or flatten the copied directories.** Skills reference each other by
sibling relative paths (`../ss-guardrails/core.md`, `../_references/<file>.md`); the
`ss-*` directories and `_references/` must stay side by side in the same parent.

**Verify:**

```bash
ls "$TARGET" | grep -c '^ss-'     # expected: 23
test -f "$TARGET/ss-guardrails/core.md" && test -d "$TARGET/_references" && echo "layout OK"
```

If OpenCode is among the targets, you can additionally confirm discovery
(run from any git repository):

```bash
opencode debug skill 2>/dev/null | grep -o '"name": *"ss-[a-z-]*"' | sort -u | wc -l   # expected: 23
```

Notes per platform — nothing extra to do, just context:

- **Codex** reads `<repo>/.agents/skills` (project) and `~/.agents/skills` (global).
- **Pi** reads `.agents/skills`, `.pi/skills` (project) and `~/.agents/skills`,
  `~/.pi/agent/skills` (global).
- **OpenCode** reads `.agents/skills`, `.opencode/skills`, `.claude/skills` (project)
  and the `~/` equivalents plus `~/.config/opencode/skills` (global). If the user
  prefers one of those alternates, copy to it instead — same layout rules apply.

### Step 4 — Check for name collisions

Before finishing, confirm no pre-existing skill shadows the `ss-` prefix:

```bash
ls "$TARGET" 2>/dev/null | sort | uniq -d
```

Any duplicate means the user already had a conflicting copy — ask whether to
overwrite (re-copy) or keep the existing one. The `ss-` prefix is chosen to avoid
collisions with other skill packs (e.g., superpowers), so duplicates normally only
appear on re-install, which is safe to overwrite.

### Step 5 — Report

Tell the user, concretely:

- which platforms were installed, at which scope and path;
- the verification results (plugin enabled / `ss-*` count);
- how to start: *"Ask your agent to `use ss-feature-workflow to implement <requirement>`,
  or invoke any `/ss-*` skill directly — see the
  [skill catalog](https://github.com/liyue2008/super-spec#skill-catalog)."*
- that a restart of the agent session may be needed before skills are visible.

## Upgrading

- **Claude Code:** `claude plugin update super-spec@super-spec` (or `/plugin` →
  manage plugins inside a session).
- **Codex / Pi / OpenCode:** re-run Step 3 — the copy is idempotent and overwrites
  in place.

## Uninstalling

- **Claude Code:** `claude plugin uninstall super-spec@super-spec`, then optionally
  `claude plugin marketplace remove super-spec`.
- **Codex / Pi / OpenCode:** remove exactly what Step 3 copied:

  ```bash
  rm -rf "$TARGET"/ss-* "$TARGET/_references"
  ```

  Nothing else is written anywhere — super-spec keeps no state outside the skills
  directory and never writes into user projects (see
  [docs/guardrails.md](docs/guardrails.md)).
