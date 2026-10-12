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

## Automatic release text checks

The main-push workflow still creates release pull requests and, after they merge,
creates tags and GitHub Releases automatically. It uses the existing repository
token permissions, with no additional secret. The workflow checks out the fixed
release tool revision, moves it into runner temporary storage, and installs only
its locked production dependencies with lifecycle scripts disabled. The entry
point requires release-please 17.3.0 before making any publication request.

[Release text checks](scripts/release-text.mjs) run before each public write:

- Pull request titles, bodies and commit messages are checked before branch,
  blob, commit or pull request creation or update.
- The full generated CHANGELOG is sanitized in memory before publication. All
  other generated files must pass validation without changing their content.
- Only the current candidate's Release notes are sanitized, before any tag or
  Release request. Existing releases and historical tags are not rewritten.
- The tool's existing completion comment is reduced to plain version labels,
  only for a successfully created candidate and its matching pull request.
  Unexpected comments and overflow note archives are rejected.

Repository context comes from the workflow environment. Recognized repository
compare, commit, issue and pull request links become plain version, short commit
or `#number` labels. Inline, reference, autolink and bare URL forms are checked;
feature descriptions, versions and dates remain intact. Unknown destinations,
malformed links, remaining repository-owner text, local paths, encoded links,
secret-like values and unsupported update shapes stop publication. Text is
limited to 65,536 characters; oversized notes never fall back to a public archive.
Failures report a constant message, not note content or upstream exceptions.

The bounded link policy retains the release tool's exact documentation/footer
and schema URLs, documentation under `nodejs.org`, `docs.github.com` and
`docs.npmjs.com`, and package tarball URLs under `registry.npmjs.org`. Other
library documentation destinations require an explicit policy change rather
than being silently removed or accepted. Generated files are restricted to the
root CHANGELOG, package/version manifests (including the two plugin manifests)
and package lock; new update paths or
upstream versions require review of the checks first. These checks are not a
proof that arbitrary prose contains no sensitive information.

Run the focused tests with `node --test scripts/tests/release-text.test.mjs`.
The canonical repository validator includes them automatically. These tests use
mocked publication boundaries; they do not trigger live releases or prove a
successful production installation. Release helpers and runner tool dependencies
are outside the package's explicit distribution allowlist.
