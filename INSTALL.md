# Installing SuperSpec Locally

Use an existing local checkout containing this document. No public registry,
package download or repository URL is assumed. Installation changes agent discovery
configuration and requires explicit user consent; workflows never install globally
as a repair step. [README.md](README.md) lists the skills.

## Choose agents and scope

Ask which agents and whether the user wants project or global scope. Do not pick
or persist a preference on their behalf. Confirm each available CLI without dumping
environment/configuration. Use an absolute SOURCE pointing to this checkout and
an explicit TARGET for manual installation.

## Claude Code local plugin

When the installed CLI supports local marketplaces, from this checkout:

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
Pi also supports `.pi/skills/` and `~/.pi/agent/skills/`. No registry package is
claimed. Codex's local plugin manifest is [.codex-plugin/plugin.json](.codex-plugin/plugin.json)
and its local marketplace is [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json).
Pi's local package discovery declaration is in [package.json](package.json).

Before copying, canonicalize SOURCE and TARGET, reject symlink escapes, and check
each destination ss-* directory for collision. Existing skills are user content:
ask before replacing, and protect a recoverable nonsecret backup externally.
Never blindly overwrite a directory or delete all skills matching a glob.

After those checks and explicit consent, copy this checkout's entire bundle:

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
and obtain consent before using it; do not guess package syntax or a published URL.

## Upgrade and uninstall

Upgrades use the same local checkout and collision/backup checks. A native local
plugin update is allowed only through the installed CLI's documented controls.
Report actual installed version/path, changes and results; never install another
agent or change project instructions to make discovery succeed.

Uninstall only the exact installed bundle/plugin paths explicitly authorized by
the user after inspecting ownership and pending work; use supported native removal
for plugin-managed files. Never remove all `.agents` files, project worktrees,
other skills, or task evidence. External checkpoint cleanup is a separate action.

## State and requirements

Workflow execution is prompt-first and does not need Node helpers. Repository
validation uses Node for static prompt-contract tests. The host keeps one protected
external checkpoint and original result/log references (optional explicit external
state fallback), never toolkit state in a user's repository. See
[workflow-checkpoint.md](skills/ss-references/workflow-checkpoint.md).
