import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const validator = resolve(root, 'scripts/validate.sh');
const read = path => readFileSync(resolve(root, path), 'utf8');
const json = path => JSON.parse(read(path));

// Select the production manifest prefix only: no full validator or test adapter.
const manifestBlocks = String.raw`
import ast, pathlib, sys
script, fixture, *args = sys.argv[1:]
source = pathlib.Path(script).read_text().split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
module = ast.parse(source, filename=script)
selected = []
for node in module.body:
    if isinstance(node, ast.For) and isinstance(node.target, ast.Name) and node.target.id == 'name':
        try:
            if ast.literal_eval(node.iter) == ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']:
                break
        except (ValueError, TypeError): pass
    selected.append(node)
else: raise AssertionError('production manifest boundary missing')
sys.argv = [script, *args]
context = {}
exec(compile(ast.Module(body=selected, type_ignores=[]), script, 'exec'), context)
print('\n'.join(context['failures']))
sys.exit(bool(context['failures']))
`;
function withManifests(check) {
  const fixture = mkdtempSync(resolve(tmpdir(), 'super-spec-npm-manifests-'));
  const files = ['package.json', 'package-lock.json', '.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json', '.codex-plugin/plugin.json', '.agents/plugins/marketplace.json'];
  const originals = Object.fromEntries(files.map(path => [path, json(path)]));
  const validate = (name, args = [], mutate = () => {}) => {
    const data = structuredClone(originals);
    data['package.json'].name = name;
    data['package-lock.json'].name = name;
    data['package-lock.json'].packages[''].name = name;
    mutate(data);
    for (const [path, value] of Object.entries(data)) {
      mkdirSync(dirname(resolve(fixture, path)), { recursive: true });
      writeFileSync(resolve(fixture, path), JSON.stringify(value));
    }
    return spawnSync('python3', ['-c', manifestBlocks, validator, fixture, ...args], { cwd: fixture, encoding: 'utf8' });
  };
  try { check(validate); } finally { rmSync(fixture, { recursive: true }); }
}

test('npm-release: exact source and scoped identities require their own validation mode', () => {
  withManifests(validate => {
    for (const [name, args, accepted] of [
      ['super-spec', [], true], ['@lbk-open/super-spec', ['--npm-release'], true],
      ['super-spec', ['--npm-release'], false], ['@lbk-open/super-spec', [], false],
      ['@other/super-spec', ['--npm-release'], false], ['super-spec-extra', [], false],
    ]) {
      const result = validate(name, args);
      assert.equal(result.status, accepted ? 0 : 1, `${name} ${args}: ${result.stdout}${result.stderr}`);
    }
  });
});

test('npm-release: both lock root names and all root/plugin versions remain binding', () => {
  withManifests(validate => {
    for (const [name, args] of [['super-spec', []], ['@lbk-open/super-spec', ['--npm-release']]]) {
      const mutations = [
        data => { data['package-lock.json'].name = '@other/super-spec'; },
        data => { data['package-lock.json'].packages[''].name = '@other/super-spec'; },
        data => { data['package-lock.json'].version = '0.1.1'; },
        data => { data['package-lock.json'].packages[''].version = '0.1.1'; },
        data => { data['package.json'].version = '0.1.1'; },
        data => { data['.claude-plugin/plugin.json'].version = '0.1.1'; },
        data => { data['.codex-plugin/plugin.json'].version = '0.1.1'; },
        data => { data['package.json'].pi.skills = ['./missing']; },
        data => { data['package.json'].keywords = []; },
      ];
      for (const mutate of mutations) {
        const result = validate(name, args, mutate);
        assert.equal(result.status, 1, `${name}: mutation must fail: ${result.stdout}${result.stderr}`);
      }
    }
  });
});

test('npm-release: argument parser fails closed before validation starts', () => {
  const prefix = read('scripts/validate.sh').split('python3')[0];
  for (const args of [[], ['--npm-release'], ['--unknown'], ['--npm-release', '--unknown'],
    ['--npm-release=other'], ['--npm-release', '--npm-release'], ['super-spec']]) {
    const accepted = args.length === 0 || (args.length === 1 && args[0] === '--npm-release');
    const result = spawnSync('bash', ['-c', `${prefix}\nprintf 'validation-started'\n`, validator, ...args], { encoding: 'utf8' });
    assert.equal(result.status, accepted ? 0 : 2, `${args}: ${result.stdout}${result.stderr}`);
    assert.equal(result.stdout.includes('validation-started'), accepted);
  }
});

// Inspect npm's real allowlist, then run the actual production Markdown-link
// block on only those files. Never install packages or execute lifecycle scripts.
const packedLinkBlock = String.raw`
import ast, pathlib, sys
script = sys.argv[1]
source = pathlib.Path(script).read_text().split("<<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
module = ast.parse(source, filename=script)
helpers = [node for node in module.body if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef))]
blocks = [node for node in module.body if isinstance(node, ast.For) and isinstance(node.iter, ast.Name) and node.iter.id == 'markdown']
assert len(blocks) == 1, 'must execute actual production Markdown-link block'
context = {'root': pathlib.Path.cwd().resolve(), 'failures': [], 'markdown': list(pathlib.Path('.').rglob('*.md'))}
exec(compile(ast.Module(body=helpers + blocks, type_ignores=[]), script, 'exec'), context)
print('\n'.join(context['failures']))
sys.exit(bool(context['failures']))
`;
test('npm-release: real packed allowlist closes Markdown links and local plugin assets', () => {
  const result = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  const packages = Array.isArray(output) ? output : output.files ? [output] : Object.values(output);
  assert.equal(packages.length, 1);
  const paths = packages[0].files.map(file => file.path);
  for (const path of ['README.md', 'README.zh-CN.md', 'INSTALL.md', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md',
    '.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', '.codex-plugin/plugin.json',
    '.agents/plugins/marketplace.json', 'assets/icon.svg']) assert.ok(paths.includes(path), `bundle missing ${path}`);
  for (const path of paths) {
    assert.ok(!path.startsWith('scripts/') && !path.startsWith('.github/') && path !== 'AGENTS.md', `checkout-only file packed: ${path}`);
    assert.ok(!path.startsWith('../') && !path.startsWith('/'), `unsafe packed path: ${path}`);
  }
  assert.equal(paths.filter(path => /^skills\/ss-[^/]+\/SKILL\.md$/.test(path)).length, 20);
  const fixture = mkdtempSync(resolve(tmpdir(), 'super-spec-packed-links-'));
  try {
    for (const path of paths) {
      mkdirSync(dirname(resolve(fixture, path)), { recursive: true });
      copyFileSync(resolve(root, path), resolve(fixture, path));
    }
    const validate = () => spawnSync('python3', ['-c', packedLinkBlock, validator], { cwd: fixture, encoding: 'utf8' });
    let links = validate();
    assert.equal(links.status, 0, `${links.stdout}${links.stderr}`);
    writeFileSync(resolve(fixture, 'README.md'), '[Broken checkout link](scripts/validate.sh)\n');
    links = validate();
    assert.equal(links.status, 1, 'a checkout-only link must still fail on the actual packed inventory');
    assert.match(links.stdout, /dangling local link: scripts\/validate.sh/);
    const codex = JSON.parse(readFileSync(resolve(fixture, '.codex-plugin/plugin.json'), 'utf8'));
    assert.ok(paths.includes(codex.interface.composerIcon.replace(/^\.\//, '')));
    assert.ok(paths.some(path => path.startsWith(codex.skills.replace(/^\.\//, ''))));
  } finally { rmSync(fixture, { recursive: true }); }
});
