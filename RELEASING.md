# Releasing SuperSpec

This checkout is a local toolkit, not evidence of a published registry package.
The local package identity is `super-spec`; no registry availability is claimed.
Release, publication, merge, and deployment require separate authorization.

Before a separately authorized release:

1. Run [repository validation](scripts/validate.sh) and inspect the complete bundle.
2. Keep the version aligned in [package.json](package.json),
   [Claude manifest](.claude-plugin/plugin.json), and
   [Codex manifest](.codex-plugin/plugin.json).
3. Update [CHANGELOG.md](CHANGELOG.md) with user-facing changes.
4. Inspect `npm pack --dry-run --json --ignore-scripts` without running lifecycle scripts.
5. Choose and verify the actual distribution destination before publishing anything.

The existing release automation configuration describes repository automation;
it does not authorize an agent to trigger a release or claim a public destination.
Use the package `files` allowlist, never a broad upload of the working directory.
See [INSTALL.md](INSTALL.md) for local bundle installation and scoped removal.
