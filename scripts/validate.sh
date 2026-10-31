#!/usr/bin/env bash
# Static repository validation; not proof of live agent execution or installation.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ $# -gt 1 || ( $# -eq 1 && "$1" != '--npm-release' ) ]]; then
  echo 'usage: scripts/validate.sh [--npm-release]' >&2
  exit 2
fi

python3 - "$@" <<'PY'
import json, pathlib, re, sys
from urllib.parse import unquote, urlsplit

root = pathlib.Path.cwd().resolve()
expected_name = '@lbk-open/super-spec' if sys.argv[1:] == ['--npm-release'] else 'super-spec'
failures = []
def fail(message): failures.append(message)

manifests = [
    '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json',
    '.codex-plugin/plugin.json', '.agents/plugins/marketplace.json', 'package.json',
]
data = {}
for name in manifests:
    try: data[name] = json.loads(pathlib.Path(name).read_text())
    except (ValueError, OSError) as error: fail(f'{name}: invalid JSON ({error})')
versions = {name: data[name].get('version') for name in
            ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', 'package.json'] if name in data}
if len(versions) != 3 or len(set(versions.values())) != 1 or not all(versions.values()):
    fail(f'missing or mismatched versions: {versions}')
if 'package.json' in data:
    package = data['package.json']
    if package.get('name') != expected_name: fail(f'package.json: package identity must be {expected_name}')
    if package.get('pi', {}).get('skills') != ['./skills']: fail('package.json: Pi bundle declaration differs')
    if 'pi-package' not in package.get('keywords', []): fail('package.json: missing Pi discovery keyword')
try:
    lock = json.loads(pathlib.Path('package-lock.json').read_text())
    package = data.get('package.json', {})
    for entry in [lock, lock.get('packages', {}).get('', {})]:
        if entry.get('name') != package.get('name') or entry.get('version') != package.get('version'):
            fail('package-lock.json: root package identity/version differs')
except (ValueError, OSError) as error: fail(f'package-lock.json: {error}')
for name in ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']:
    plugins = data.get(name, {}).get('plugins', [])
    if not plugins: fail(f'{name}: missing local plugin declaration')
    for plugin in plugins:
        source = plugin.get('source')
        if isinstance(source, dict): source = source.get('path')
        if (not isinstance(source, str) or not source
                or pathlib.Path(source).is_absolute()
                or '..' in pathlib.Path(source).parts
                or not (root / source).resolve().is_relative_to(root)
                or not (root / source).is_dir()):
            fail(f'{name}: invalid local source')
codex = data.get('.codex-plugin/plugin.json', {})
skill_sources = codex.get('skills', [])
if isinstance(skill_sources, str): skill_sources = [skill_sources]
for source in skill_sources:
    if not isinstance(source, str) or not pathlib.Path(source).is_dir():
        fail(f'Codex manifest: missing skills path {source}')
icon = codex.get('interface', {}).get('composerIcon')
if icon and not pathlib.Path(icon).is_file(): fail('Codex manifest: missing composer icon')

skill_dirs = sorted(path for path in pathlib.Path('skills').iterdir()
                    if path.is_dir() and path.name.startswith('ss-'))
for directory in skill_dirs:
    path = directory / 'SKILL.md'
    if not path.is_file():
        fail(f'{directory}: missing SKILL.md'); continue
    match = re.match(r'\A---\n(.*?)\n---\n', path.read_text(), re.S)
    if not match:
        fail(f'{path}: missing frontmatter'); continue
    frontmatter = match.group(1)
    keys = re.findall(r'^([A-Za-z-]+):', frontmatter, re.M)
    if sorted(keys) != ['description', 'name']: fail(f'{path}: expected only name and description')
    name = re.search(r'^name:\s*(\S+)\s*$', frontmatter, re.M)
    if not name or name.group(1) != directory.name: fail(f'{path}: name differs from directory')
    description = re.search(r'^description:\s*(.+)', frontmatter, re.M | re.S)
    if not description or len(description.group(1)) > 1024: fail(f'{path}: missing or oversized description')
expected = re.findall(r'expected: (\d+)', pathlib.Path('INSTALL.md').read_text())
if not expected: fail('INSTALL.md: missing expected bundle count')
for count in expected:
    if int(count) != len(skill_dirs): fail(f'INSTALL.md expects {count}, found {len(skill_dirs)} skills')

shared = ['workflow-common', 'workflow-checkpoint', 'agent-discipline', 'openspec-delta']
for name in shared:
    if not pathlib.Path(f'skills/ss-references/{name}.md').is_file(): fail(f'missing shared policy: {name}')
contracts = [
    ('**Repositories Involved:**', ['skills/ss-references/proposal-template.md', 'skills/ss-references/multi-repo-detection.md']),
    ('**Repositories Requiring Fix:**', ['skills/ss-inspect/SKILL.md', 'skills/ss-references/multi-repo-detection.md']),
    ('---SS-RESULT---', ['skills/ss-coding-workflow/SKILL.md', 'skills/ss-multi-repo-workflow/SKILL.md']),
]
for token, paths in contracts:
    for path in paths:
        if token not in pathlib.Path(path).read_text(): fail(f'{path}: missing {token}')

# All delivered Markdown links; inline sibling paths only in skill consumers.
markdown = list(pathlib.Path('skills').rglob('*.md')) + list(pathlib.Path('docs').rglob('*.md')) + list(pathlib.Path('.').glob('*.md'))
for path in markdown:
    text = path.read_text()
    links = re.findall(r'\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', text)
    links += re.findall(r'^\s*\[[^\]]+\]:\s*(\S+)', text, re.M)
    # Skills consume sibling paths; ordinary docs may only explain that syntax.
    if len(path.parts) >= 3 and path.parts[0] == 'skills' and path.parts[1].startswith('ss-'):
        links += re.findall(r'\.\./ss-[a-z-]+/[A-Za-z0-9._/-]+\.md', text)
    for link in sorted(set(links)):
        parsed = urlsplit(link.strip('<>'))
        if parsed.scheme or parsed.netloc or not parsed.path: continue
        destination = (path.parent / unquote(parsed.path)).resolve()
        if not destination.is_relative_to(root): fail(f'{path}: local link escapes bundle: {link}')
        elif not destination.exists(): fail(f'{path}: dangling local link: {link}')
    if path.name not in ['README.md', 'README.zh-CN.md'] and re.search(r'[\u4e00-\u9fff]', text):
        fail(f'{path}: expected native English content')

if failures:
    print('\n'.join('FAIL: ' + message for message in failures), file=sys.stderr)
    sys.exit(1)
print(f'OK: {len(skill_dirs)} skills, local links/manifests/contracts valid, package {expected_name}, version {next(iter(versions.values()))}')
PY

if command -v node >/dev/null 2>&1; then
  node --test scripts/tests/*.test.mjs
else
  echo 'FAIL: Node is required for repository static prompt-contract tests, not workflow execution' >&2
  exit 1
fi

if command -v claude >/dev/null 2>&1; then
  claude plugin validate .
else
  echo 'note: Claude CLI unavailable; native plugin validation was NOT RUN'
fi
