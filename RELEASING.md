# Releasing SuperSpec

This is a **full-checkout-only** release procedure, not part of the npm bundle.
The source identity stays `super-spec`; the established npm/Pi distribution identity
is exactly `@lbk-open/super-spec`. Neither metadata nor a GitHub Release establishes
npm availability. Release, publication, merge and deployment need separate authority.
See [INSTALL.md](INSTALL.md) for installation and scoped removal.

## Provenance for the 0.2.0 repair

Previous npm `@lbk-open/super-spec@0.1.1` records gitHead
`f03862cb717c2541479e439261bf85072f65876c`. The repair starts from main
`22b82a7de5ba5176ab88dc5cffda2fff2d559486`, not the existing GitHub `v0.2.0` tag
at `14da4a7f2e940c4cde50379a68d54e45176e166f`. Do not rewrite that tag or imply
that it contains this repair. Record the actual reviewed/merged source SHA and
scoped candidate digest in release evidence. 0.2.0 is not claimed published until
npm and the [Pi gallery entry](https://pi.dev/packages/@lbk-open/super-spec) are checked.

## Authorized scoped staging

Keep version 0.2.0 aligned in [package.json](package.json), both lock root entries,
[Claude manifest](.claude-plugin/plugin.json) and
[Codex manifest](.codex-plugin/plugin.json); update [CHANGELOG.md](CHANGELOG.md).
The default [canonical validator](scripts/validate.sh) strictly requires local
`super-spec`. Its only optional mode, `--npm-release`, requires exactly
`@lbk-open/super-spec` and preserves all other checks, including both lock identities.
Unknown arguments, other scopes and mismatched identities/versions fail closed.
Do not rename source or weaken default validation to make a release pass.

The owner runs selected tests only. After independent review, the retained final
verifier runs canonical full validation on the clean committed source and the exact
scoped stage. Freeze the source before review; no late commit/rebase or source
repairs during publication. If merging changes the proven identity/bytes, bind fresh
review/verification before release. Keep evidence outside the repository, with
0700 directories/0600 files; do not capture credentials or private configuration.

With explicit release authority, prepare a new external staging directory from the
exact audited commit, never by copying a dirty working directory. Set SOURCE_SHA
to that full reviewed commit SHA and RELEASE_EVIDENCE to an already verified,
protected absolute directory outside the checkout. The archive contains committed
source only: no Git metadata, untracked files, local credentials or agent configs.
Audit tracked content before staging; never add secrets to source.

```bash
set -euo pipefail
umask 077
: "${SOURCE_SHA:?set the exact reviewed source commit}"
: "${RELEASE_EVIDENCE:?set a protected external evidence directory}"
test "$(git rev-parse HEAD)" = "$SOURCE_SHA"
test -z "$(git status --porcelain --untracked-files=all)"
# Full checks belong to the retained verifier, AFTER independent review.
./scripts/validate.sh > "$RELEASE_EVIDENCE/source-validation.log" 2>&1
STAGE="$(mktemp -d "$RELEASE_EVIDENCE/scoped-candidate.XXXXXX")"
git archive --format=tar "$SOURCE_SHA" | tar -x -C "$STAGE"
python3 - "$STAGE" <<'PY'
import json, pathlib, sys
stage = pathlib.Path(sys.argv[1])
package_path, lock_path = stage / 'package.json', stage / 'package-lock.json'
package, lock = [json.loads(path.read_text()) for path in (package_path, lock_path)]
entries = [package, lock, lock['packages']['']]
assert all(entry['name'] == 'super-spec' and entry['version'] == '0.2.0' for entry in entries)
# Change only these three name fields; everything else remains committed source.
for entry in entries:
    entry['name'] = '@lbk-open/super-spec'
for path, data in ((package_path, package), (lock_path, lock)):
    path.write_text(json.dumps(data, indent=2) + '\n')
PY
(
  cd "$STAGE"
  ./scripts/validate.sh --npm-release > "$RELEASE_EVIDENCE/scoped-validation.log" 2>&1
  npm pack --dry-run --json --ignore-scripts > "$RELEASE_EVIDENCE/scoped-pack.json"
)
```

Compare the entire stage with a fresh archive of SOURCE_SHA: allow only the three
root-name field changes above, with no other byte/mode/symlink differences. Bind
pre/post verification evidence to the source inputs and stage inventory, not HEAD
alone. Stage files are committed source reproductions, not a second mutable source.
Canonical full checks use repository scripts in the stage; no alternate full-test
adapter or executable publisher is needed.

Inspect npm's **actual** file list, not just `package.json`. Depending on npm's
version, JSON can be an array, one package object or an object keyed by package name:

```python
import json
with open('scoped-pack.json') as stream:
    result = json.load(stream)
packages = result if isinstance(result, list) else ([result] if 'files' in result else list(result.values()))
assert len(packages) == 1
candidate = packages[0]
assert candidate['name'] == '@lbk-open/super-spec' and candidate['version'] == '0.2.0'
paths = {entry['path'] for entry in candidate['files']}
```

Check all 20 skill directories, every relative Markdown link against that file
list, local plugin manifests and the Codex icon. The explicit allowlist includes
only skills, docs, essential root docs/manifests/assets; npm also includes README,
LICENSE and package.json. Repository instructions, tests, release helpers, workflows,
Git metadata and credentials must stay out. Do not broaden the upload to make links
pass: describe checkout-only files as code rather than broken bundle links.

Only a separately authorized publisher may publish the identical verified stage
to npm under `@lbk-open/super-spec@0.2.0`. Do not publish the unscoped source, rebuild
from the historical tag, or mutate a candidate after verification. Preserve the
actual archive digest, npm integrity, source SHA and original command/log results.
After publication, query npm for the exact version/name and integrity, then inspect
the Pi gallery version; `pi-package` and `pi.skills` metadata make discovery possible
but do not prove indexing. Native installation/discovery checks need separate consent.
The existing GitHub automation is not an npm publisher or release authorization.

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
