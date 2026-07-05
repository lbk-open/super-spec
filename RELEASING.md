# Releasing super-spec

Releases here are lightweight by design. There is nothing to build and nothing to
publish to a registry: every distribution channel — the Claude Code plugin
marketplace, the Codex plugin marketplace, Pi's git packages, and the `npx skills`
CLI — pulls straight from this git repository. A release is therefore exactly four
things, and automation handles all of them:

1. a semver bump, kept in sync across `.claude-plugin/plugin.json`,
   `.codex-plugin/plugin.json`, and `package.json`;
2. an updated `CHANGELOG.md`;
3. a `vX.Y.Z` tag;
4. a GitHub Release with generated notes.

## The normal flow: merge one PR

Releases are automated with
[release-please](https://github.com/googleapis/release-please-action), driven by
the [Conventional Commits](https://www.conventionalcommits.org/) already used in
this repository.

1. **Do your work as usual.** Land changes on `main` with conventional commit
   messages. CI (`.github/workflows/ci.yml`) runs `scripts/validate.sh` on every
   PR and push.
2. **release-please maintains a Release PR.** After each push to `main`, the
   `release-please` workflow opens (or updates) a PR titled
   `chore(main): release x.y.z` containing the version bumps in all three
   manifests plus the `CHANGELOG.md` entry, computed from the commits since the
   last release.
3. **Merge the Release PR when you want to ship.** That merge is the only manual
   release step. The workflow then creates the `vX.Y.Z` tag and publishes the
   GitHub Release automatically.

Which commits produce which bump:

| Commit | Effect on the next release |
|---|---|
| `fix: …` | patch bump |
| `feat: …` | minor bump |
| `feat!: …` or a `BREAKING CHANGE:` footer | major bump (pre-1.0: minor bump — see below) |
| `docs:`, `chore:`, `refactor:`, `test:`, `ci:` | no release triggered; not listed as features/fixes |

**Pre-1.0 policy:** `bump-minor-pre-major` is enabled, so breaking changes bump
the minor version while we're on `0.x`. Declaring `1.0.0` is a deliberate act:
add a `Release-As: 1.0.0` footer to any commit and release-please will target
that version.

## What CI validates

`scripts/validate.sh` (also runnable locally) checks:

- all five manifests parse as JSON, and the three plugin manifests agree on `version`;
- every `skills/ss-*/` directory has a `SKILL.md` with exactly `name` +
  `description` frontmatter, `name` matching the directory;
- the skill count matches what `INSTALL.md` asserts in its verify steps;
- every `../ss-guardrails/…` and `../_references/…` reference resolves;
- the cross-file interface contracts are intact (`**Repositories Involved:**`,
  `**Repositories Requiring Fix:**`, `---SS-RESULT---`);
- distributed content (`skills/`, `docs/`, `INSTALL.md`) stays English-only;
- when the `claude` CLI is available (locally), `claude plugin validate .` passes.

## After a release: how users get it

No publishing steps — each channel pulls on its own schedule:

| Channel | How the update reaches users |
|---|---|
| Claude Code | `claude plugin update super-spec@super-spec` (or the `/plugin` panel) |
| Codex | `codex plugin marketplace upgrade super-spec` (re-clones only when the git SHA changed) |
| Pi | `pi update --all` (installs without a version pin track latest) |
| OpenCode / `skills` CLI | `npx skills update` |
| Manual copies | re-run the copy from [INSTALL.md](INSTALL.md) |

## One-time repository setup

Already configured in-tree, but the GitHub settings below must be enabled once
(Settings → Actions → General), or release-please cannot open its PR:

- **Workflow permissions**: "Read and write permissions"
- **Allow GitHub Actions to create and approve pull requests**: checked

## Manual fallback

If Actions are unavailable, a release is still just:

```bash
./scripts/validate.sh
# bump "version" in package.json, .claude-plugin/plugin.json, .codex-plugin/plugin.json
# add the CHANGELOG.md entry
git commit -am "chore: release X.Y.Z"
git tag vX.Y.Z && git push origin main vX.Y.Z
gh release create vX.Y.Z --generate-notes
```

Keep the three manifests in sync — `scripts/validate.sh` fails the build if they
drift.
