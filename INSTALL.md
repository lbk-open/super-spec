# Installing SuperSpec

Use either the established npm/Pi package `@lbk-open/super-spec` or a full source
checkout (local name `super-spec`). The npm bundle contains all 20 skills, docs,
local plugin manifests and the Codex icon; development tests and release tooling
require a full checkout. [README.md](README.md) lists the skills.

Installation changes agent discovery configuration and requires explicit user
consent; workflows never install globally as a repair step. The
[Pi gallery entry](https://pi.dev/packages/@lbk-open/super-spec) is not proof that a
particular version is published. Check `npm view @lbk-open/super-spec version`
before choosing a version; 0.2.0 remains a candidate until registry verification.

## Choose agents and scope

Ask which agents and whether the user wants project or global scope. Do not pick
or persist a preference on their behalf. Confirm each available CLI without dumping
environment/configuration. Use an absolute SOURCE pointing to this checkout or
an inspected extracted npm bundle and an explicit TARGET for manual installation.

## Pi npm package

After consent, install the unpinned package to follow future updates:

```bash
pi install npm:@lbk-open/super-spec
pi list
```

This is personal scope (`~/.pi/agent/settings.json`). For project scope use
`pi install npm:@lbk-open/super-spec --local`; Pi writes `.pi/settings.json` and
loads project packages only after project trust. Review the package before
trusting it. For a reproducible version, append an actually published version,
for example `npm:@lbk-open/super-spec@0.1.1`; versioned npm sources are pinned.
Do not request `@0.2.0` until it is confirmed published.

With the installed Pi's documented CLI, update this package with
`pi update npm:@lbk-open/super-spec`, or all packages with `pi update --extensions`.
Pinned sources stay pinned. `pi update` alone updates Pi itself; `pi update --all`
also updates Pi, so it is not a package-only upgrade. Older Pi versions may differ:
read `pi update --help` rather than guessing. Verify the actual `pi list` result,
startup diagnostics and `/skill:ss-feature-workflow` after reload/restart; configured
package listing alone is not skill-discovery proof.

For an authorized removal use `pi remove npm:@lbk-open/super-spec` (add `--local`
for the project declaration). Do not manually delete Pi-managed directories.

## Claude Code local plugin

When the installed CLI supports local marketplaces, from this checkout or an
inspected extracted npm bundle containing the supplied manifests:

```bash
claude plugin marketplace add ./
claude plugin install super-spec@super-spec
claude plugin list
```

Check the real result and enabled plugin; do not fabricate discovery. Missing or
unsupported CLI is a limitation, not authorization for another protocol. Local
plugin manifests are in [.claude-plugin](.claude-plugin/plugin.json).

## Codex, Pi and OpenCode manual bundle

These agents support skill discovery using a project `.agents/skills/` or global
`~/.agents/skills/` directory. Verify the installed agent's actual discovery rules;
Pi also supports `.pi/skills/` and `~/.pi/agent/skills/`; its npm route above avoids
manual copying. Codex's local plugin manifest is [.codex-plugin/plugin.json](.codex-plugin/plugin.json)
and its local marketplace is [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json).
Pi's local package discovery declaration is in [package.json](package.json).

Before copying, canonicalize SOURCE and TARGET, reject symlink escapes, and check
each destination ss-* directory for collision. Existing skills are user content:
ask before replacing, and protect a recoverable nonsecret backup externally.
Never blindly overwrite a directory or delete all skills matching a glob.

After those checks and explicit consent, copy SOURCE's entire skill bundle:

```bash
# Set both variables to verified absolute paths; do not run with empty values.
test -n "$SOURCE" && test -n "$TARGET"
test -d "$SOURCE/skills"
mkdir -p "$TARGET"
cp -R "$SOURCE/skills/"ss-* "$TARGET/"
ls "$TARGET" | grep -c '^ss-'  # expected: 20
 test -f "$TARGET/ss-guardrails/core.md" &&  test -f "$TARGET/ss-references/workflow-common.md" &&  test -f "$TARGET/ss-references/workflow-checkpoint.md" && echo 'layout OK'
```

Install every ss-* directory, including ss-references and ss-guardrails, side by
side with unchanged names. A single copied skill has dangling sibling references.
Verify the exact copied bundle paths and real agent discovery (restart only if
needed). CLI discovery checks are optional and platform-dependent, not static proof.
If the agent offers a supported local plugin/package route, check its local help
and obtain consent before using it; do not guess other package syntax or URLs.

## Upgrade and uninstall

Manual upgrades use an inspected checkout/extracted bundle and the same
collision/backup checks. Pi npm updates use the commands above. A native local
plugin update is allowed only through the installed CLI's documented controls.
Report actual installed version/path, changes and results; never install another
agent or change project instructions to make discovery succeed.

Uninstall only the exact installed bundle/plugin paths explicitly authorized by
the user after inspecting ownership and pending work; use supported native removal
for plugin-managed files. Never remove all `.agents` files, project worktrees,
other skills, or task evidence. External checkpoint cleanup is a separate action.

## State and requirements

Workflow execution is prompt-first and does not need Node helpers. Pi itself has
its own host requirements. Repository validation uses Node for static prompt-contract
tests and is available only in the full checkout, not the npm bundle. The host keeps
one protected external checkpoint and original result/log references (optional explicit external
state fallback), never toolkit state in a user's repository. See
[workflow-checkpoint.md](skills/ss-references/workflow-checkpoint.md).
