import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Static checks of the delivered prompts, not live agent or native execution proof.
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => existsSync(resolve(root, path)) ? readFileSync(resolve(root, path), 'utf8') : '';
const normalize = text => text.replace(/\s+/g, ' ').trim().toLowerCase();
const ref = name => `skills/ss-references/${name}.md`;
const skill = name => `skills/${name}/SKILL.md`;
const rules = [
  ['flags', ref('workflow-common'), ['--auto / -a', '--decide / -d', '--worktree / -w', '--no-worktree / -W', 'invocation only', 'combined short flags', 'quoted text, code blocks, URLs', 'option values', 'conflicting workspace flags', 'human / auto / pending', 'does not imply --auto']],
  ['checkpoint', ref('workflow-checkpoint'), ['rawInput', 'normalizedFlags', 'gateCompletion', 'authorizedScope', 'not-yet-created', '0700', '0600', 'symlink', 'submodule', 'index', 'configuration hashes', 'cancellation', 'original host results', 'not authorization']],
  ['ownership', ref('agent-discipline'), ['one continuous owner', 'actual parent model', 'fresh read-only reviewer', 'one retained verifier', 'unknown writer', 'terminal', 'bounded', 'same logical owner', 'no automatic CLI']],
  ['quality', skill('ss-coding'), ['behavioral RED', 'minimum GREEN', 'INCOMPLETE_REVIEW', 'group accepted fixes', 'fresh impact review', 'AFTER review', 'owner never runs the full suite', 'full failure', 'or fixed review rounds']],
  ['review', skill('ss-code-review'), ['fresh read-only reviewer', 'causal callers', 'uncertainty', 'out-of-scope debt', 'INCOMPLETE_REVIEW', 'no confidence threshold', 'currentFingerprint']],
  ['spec', ref('openspec-delta'), ['before the proposal gate', 'staged validation mirror', 'no-delta', 'existing promise', 'stable change-id', 'strict', 'human or auto', 'materialize', 'before independent review']],
  ['plan', skill('ss-plan'), ['reuse sufficient decomposition', 'test intent', 'interfaces', 'invariants', 'wiring', 'no exact implementation bodies', 'do not regenerate', '**BASE_SHA:**', '**Repos:**']],
  ['publication', skill('ss-create-pr'), ['before review', 'no late rebase', 'currentFingerprint', 'or full-suite rerun', 'local delivery', 'never merge or deploy']],
  ['workspace', skill('ss-create-branch'), ['explicit flag > repository default > isolated default', 'origin', 'remote default', 'submodule', 'no automatic stash', 'no silent in-place fallback', 'no dependency installation']],
  ['cleanup', skill('ss-cleanup'), ['separate authorization', 'exact paths', 'never force', 'untracked', 'symlink', 'checkpoint']],
  ['multi-repo', skill('ss-multi-repo-workflow'), ['native capability', 'real cwd', 'dependencies', 'blocked dependents', 'no automatic CLI', 'normalizedFlags', 'gateCompletion', 'currentFingerprint']],
];
for (const [group, path, clauses] of rules) {
  test(`contract:${group}: ${path}`, () => {
    const text = normalize(read(path));
    for (const clause of clauses) assert.ok(text.includes(normalize(clause)), `${path}: missing ${clause}`);
  });
  test(`mutation:${group}: weakening a required prompt clause is rejected`, () => {
    const text = normalize(read(path));
    const complete = candidate => clauses.every(clause => candidate.includes(normalize(clause)));
    assert.ok(complete(text), 'baseline must satisfy the contract before mutation');
    for (const clause of clauses) {
      const weakened = text.split(normalize(clause)).join('omitted constraint');
      assert.equal(complete(weakened), false, `weakening ${clause} must fail`);
    }
  });
}
const workflowNames = ['ss-feature-workflow', 'ss-coding-workflow', 'ss-troubleshooting-workflow'];
for (const name of workflowNames) test(`handoff:${name}: context survives delegation and recovery`, () => {
  const text = normalize(read(skill(name)));
  for (const clause of ['workflow-common.md', 'workflow-checkpoint.md', 'agent-discipline.md', 'normalizedFlags', 'gateCompletion', 'authorizedScope', 'workspace', 'currentFingerprint', 'same logical owner'])
    assert.ok(text.includes(normalize(clause)), `${name}: missing ${clause}`);
});
test('gates: feature and troubleshooting preserve real completion distinctions', () => {
  const feature = read(skill('ss-feature-workflow'));
  assert.ok(feature.includes('proposal + applicable delta'));
  assert.ok(feature.includes('before human or explicit auto gate'));
  assert.ok(feature.includes('not fabricated human approval'));
  const troubleshooting = read(skill('ss-troubleshooting-workflow'));
  for (const clause of ['root-cause confirmation', 'no-delta', '**Violated Invariant:**', '**Owning Boundary:**', '**Patch-Style Alternative Rejected:**']) assert.ok(troubleshooting.includes(clause));
});
test('results: producer and consumer share strict fields and success invariants', () => {
  const fields = ['taskId', 'repoId', 'status', 'checkpoint', 'currentFingerprint', 'reviewEvidence', 'fullEvidence', 'delivery', 'blockers'];
  for (const name of ['ss-coding-workflow', 'ss-multi-repo-workflow']) {
    const text = read(skill(name));
    assert.ok(text.includes('---SS-RESULT---'));
    for (const field of fields) assert.ok(text.includes(`"${field}"`), `${name}: missing ${field}`);
    for (const clause of ['SUCCESS', 'BLOCKED', 'CANCELLED', 'FAILED', 'APPROVED', 'same currentFingerprint']) assert.ok(text.includes(clause));
  }
});
test('bundle: retired artifact machinery is absent and not referenced', () => {
  const retired = ['runtime-artifacts', 'task-report-schema', 'review-package-schema', 'session-capsule-schema', 'proposal-approval-schema'];
  for (const name of retired) assert.equal(existsSync(resolve(root, ref(name))), false);
  for (const name of [...workflowNames, 'ss-coding', 'ss-code-review', 'ss-proposal', 'ss-cleanup', 'ss-create-branch', 'ss-create-pr', 'ss-references']) {
    const text = read(skill(name));
    for (const name of retired) assert.equal(text.includes(`${name}.md`), false);
    for (const field of ['artifact_manifest', 'session_capsule']) assert.equal(text.includes(field), false);
  }
});

// Each scenario checks the actual instruction for an edge, not an emulated runner.
const scenarios = [
  ['combined aliases and conflicts', ref('workflow-common'), ['-adw', '-daW', '-aw', '-wW', 'idempotently', 'uppercase', 'unknown options', 'never use last-one-wins']],
  ['input boundaries and option values', ref('workflow-common'), ['outer option positions', 'quoted text, code blocks, URLs', 'option values', 'begin with a dash', '`--` as end of options']],
  ['decide alone does not waive human gates', ref('workflow-common'), ['does not imply --auto', 'Without explicit `--auto`', 'urgency', 'old approval', 'not fabricated human approval']],
  ['no new permission from policy auto', ref('workflow-common'), ['Auto does not grant new permissions', 'new product/scope decisions remain blocked']],
  ['recovery must prove ownership', ref('agent-discipline'), ['unknown writer', 'blocks replacement', 'host proves termination', 'same logical owner', 'restore', 'checkpoint', 'no automatic CLI/protocol switch']],
  ['wait is not success and cancellation stops scheduling', ref('agent-discipline'), ['A returned wait, timeout, missing notification', 'not terminal success', 'Cancellation stops scheduling', 'confirm terminal state']],
  ['dirty candidate and secrets stay bound', ref('workflow-checkpoint'), ['not HEAD alone', 'tracked/untracked/ignored files', 'modes', 'symlink targets', 'index', 'configuration hashes', 'submodule dirt', 'must not enter raw backups/logs', 'input drift invalidates']],
  ['gated staging is materialized once', ref('openspec-delta'), ['before the proposal gate', 'staged validation mirror', 'stable change-id', 'identical approved proposal/delta bytes', 'before independent review']],
  ['no-delta repairs cannot change semantics', ref('openspec-delta'), ['restoring an existing promise', 'written reason', 'unchanged semantics', 'Changed semantics require a real scope decision']],
  ['full failure does not bypass review', skill('ss-coding'), ['AFTER review', 'same owner targeted repair', 'fresh impact review', 'retained verifier revalidation', 'Do not waive failures']],
  ['publication cannot silently repair the candidate', skill('ss-create-pr'), ['no late rebase', 'source edit', 'full-suite rerun', 'If current bytes differ', 'stop and return to owner/impact review/retained verifier']],
  ['multi-repo missing capability blocks dependency success', skill('ss-multi-repo-workflow'), ['native capability', 'real cwd', 'Missing native capability is BLOCKED', 'blocked dependents', 'repo-local PASS alone does not prove integration']],
];
for (const [scenario, path, clauses] of scenarios) test(`scenario:${scenario}`, () => {
  const text = normalize(read(path));
  for (const clause of clauses) assert.ok(text.includes(normalize(clause)), `${path}: ${scenario}: missing ${clause}`);
  for (const clause of clauses) {
    const weakened = text.split(normalize(clause)).join('omitted edge constraint');
    assert.equal(clauses.every(required => weakened.includes(normalize(required))), false);
  }
});
test('causal-spec: entry points retain delta producer and pre-review archive timing', () => {
  const skeleton = read(ref('openspec-skeleton'));
  const reverse = read(skill('ss-reverse-spec'));
  assert.ok(skeleton.includes('`ss-write-spec` prepares applicable deltas'));
  assert.ok(skeleton.includes('before independent review'));
  assert.ok(skeleton.includes('standalone use needs mutation permission'));
  assert.ok(reverse.includes('standalone baseline discovery does not introduce that gate'));
  for (const name of ['ss-plan', 'ss-write-spec', 'ss-archive', 'ss-reverse-spec']) {
    assert.equal(read(skill(name)).includes('Phase 0'), false, `${name}: obsolete delta producer`);
  }
  assert.equal(skeleton.includes('automatically by `ss-create-pr`'), false);
});
// These identity scenarios inspect real prompt clauses, not simulated Git execution.
const publicationIdentityClauses = [
  'no late commit', 'only push the committed identity', 'same currentFingerprint',
  'including HEAD/index/diff', 'local delivery',
];
const identityComplete = text => publicationIdentityClauses.every(clause => text.includes(normalize(clause)))
  && !text.includes('beyond that mechanical identity requires revalidation');
test('fix:late-commit: publication cannot exempt a new Git identity from evidence binding', () => {
  const text = normalize(read(skill('ss-create-pr')));
  assert.ok(identityComplete(text), 'publication must forbid late commit and bind the already proven committed identity');
  for (const clause of publicationIdentityClauses) {
    assert.equal(identityComplete(text.split(normalize(clause)).join('omitted identity constraint')), false);
  }
  // Reintroducing the old exemption must fail even when all positive clauses remain.
  assert.equal(identityComplete(`${text} Source/config/index drift beyond that mechanical identity requires revalidation.`.toLowerCase()), false);
});
const preparationIdentityRules = [
  [skill('ss-coding'), ['required commits before review', 'only with existing Git authorization', 'including accepted fixes', 'committed identity']],
  [ref('workflow-common'), ['required commits before independent review', 'only with existing Git authorization', 'committed identity', 'no late commit']],
  [ref('implementer-prompt'), ['required commits before review', 'only with existing Git authorization', 'committed identity']],
  [skill('ss-coding-workflow'), ['required commits BEFORE review', 'only with existing Git authorization', 'committed identity', 'No late commit']],
  [skill('ss-feature-workflow'), ['required commits before review', 'only with existing Git authorization', 'committed identity']],
  [skill('ss-troubleshooting-workflow'), ['required commits before review', 'only with existing Git authorization', 'committed identity']],
  ['docs/workflows.md', ['required commits BEFORE review', 'only with existing Git authorization', 'committed identity', 'no late commit']],
  ['README.md', ['required commits before review', 'only with existing Git authorization', 'committed identity']],
];
test('fix:pre-review-commit: owner and preparation consumers establish identity without expanding permission', () => {
  for (const [path, clauses] of preparationIdentityRules) {
    const text = normalize(read(path));
    const complete = candidate => clauses.every(clause => candidate.includes(normalize(clause)));
    for (const clause of clauses) assert.ok(text.includes(normalize(clause)), `${path}: missing ${clause}`);
    for (const clause of clauses) assert.equal(complete(text.split(normalize(clause)).join('omitted preparation constraint')), false);
  }
});
test('fix:strict-identity: HEAD/index/diff and result equality remain binding', () => {
  const checkpoint = normalize(read(ref('workflow-checkpoint')));
  for (const clause of ['branch/base/HEAD identity', 'index and diff hashes', 'input drift invalidates review/full validation even at unchanged HEAD'])
    assert.ok(checkpoint.includes(normalize(clause)));
  for (const name of ['ss-coding-workflow', 'ss-multi-repo-workflow']) {
    const text = normalize(read(skill(name)));
    for (const clause of ['same currentFingerprint in checkpoint, result, review and full evidence', 'zero blockers and LOCAL or PR delivery'])
      assert.ok(text.includes(normalize(clause)), `${name}: identity constraint must not be weakened`);
  }
});
test('result-shape: documented producer and consumer schema and rules match exactly', () => {
  const producer = read(skill('ss-coding-workflow'));
  const consumer = read(skill('ss-multi-repo-workflow'));
  const extract = text => {
    const parts = text.split('---SS-RESULT---');
    assert.equal(parts.length, 3, 'exactly one paired result block');
    return JSON.parse(parts[1]);
  };
  assert.deepEqual(extract(producer), extract(consumer));
  const rules = 'Emit exactly one JSON object';
  const start = producer.indexOf(rules);
  assert.ok(start >= 0);
  assert.ok(consumer.includes(producer.slice(start).trim()), 'consumer must enforce the complete producer rules');
});

// Execute only the production validator's source/link AST blocks on external
// fixtures. No full validator/suite, alternate parser, or live agent proof.
const validatorBlocks = String.raw`
import ast, json, pathlib, sys
script, fixture, request = sys.argv[1:]
source = pathlib.Path(script).read_text().split("python3 <<'PY'\n", 1)[1].split('\nPY\n', 1)[0]
module = ast.parse(source, filename=script)
blocks = []
for node in module.body:
    if isinstance(node, ast.For):
        if isinstance(node.target, ast.Name) and node.target.id == 'name':
            try:
                if ast.literal_eval(node.iter) == ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']:
                    blocks.append(node)
            except (ValueError, TypeError):
                pass
        elif isinstance(node.iter, ast.Name) and node.iter.id == 'markdown':
            blocks.append(node)
assert len(blocks) == 2, 'must select the two actual production validation blocks'
helpers = [node for node in module.body if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef))]
request = json.loads(request)
context = {'root': pathlib.Path(fixture).resolve(), 'failures': [],
           'data': {name: {'plugins': [{'source': request['source']}]}
                    for name in ['.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json']},
           'markdown': [pathlib.Path(path) for path in request['markdown']]}
selected = ast.Module(body=helpers + blocks, type_ignores=[])
exec(compile(ast.fix_missing_locations(selected), script, 'exec'), context)
print(json.dumps(context['failures']))
`;
function validateActualBlocks(bundle, source, markdown) {
  const result = spawnSync('python3', ['-c', validatorBlocks, resolve(root, 'scripts/validate.sh'), bundle,
    JSON.stringify({ source, markdown })], { cwd: bundle, encoding: 'utf8' });
  assert.equal(result.status, 0, `actual validator block must execute: ${result.stderr}`);
  return JSON.parse(result.stdout);
}
function withValidatorFixture(check) {
  const fixture = mkdtempSync(resolve(tmpdir(), 'super-spec-validator-'));
  const bundle = resolve(fixture, 'bundle');
  for (const path of ['docs', 'skills/ss-example', 'skills/ss-guardrails']) mkdirSync(resolve(bundle, path), { recursive: true });
  mkdirSync(resolve(fixture, 'outside'));
  writeFileSync(resolve(bundle, 'skills/ss-guardrails/core.md'), '# Guardrails\n');
  symlinkSync(resolve(fixture, 'outside'), resolve(bundle, 'escape'));
  const validate = (source, documents = {}) => {
    for (const [path, text] of Object.entries(documents)) writeFileSync(resolve(bundle, path), text);
    return validateActualBlocks(bundle, source, Object.keys(documents));
  };
  try { check(validate, bundle); } finally { rmSync(fixture, { recursive: true }); }
}
test('validator:V2-01+V2-02: actual current manifest and guardrail docs pass the two production blocks', () => {
  const source = JSON.parse(read('.agents/plugins/marketplace.json')).plugins[0].source;
  assert.deepEqual(validateActualBlocks(root, source, ['docs/guardrails.md', 'skills/ss-coding/SKILL.md']), []);
});
test('validator:V2-01: actual local-source block accepts legal root and relative directories', () => {
  withValidatorFixture(validate => {
    for (const source of ['.', './', 'skills', './skills', './skills/ss-example', { source: 'local', path: '.' }])
      assert.deepEqual(validate(source), [], `valid local directory ${JSON.stringify(source)} must pass`);
  });
});
test('validator:V2-01: actual local-source block rejects unsafe or missing directories', () => {
  withValidatorFixture((validate, bundle) => {
    for (const source of [null, 42, {}, { source: 'local', path: null }, '', '/tmp', bundle,
      '../outside', './skills/../docs', './missing', './escape', './skills/ss-guardrails/core.md']) {
      const failures = validate(source);
      assert.equal(failures.length, 2, `invalid local source ${JSON.stringify(source)} must fail both manifests`);
      assert.ok(failures.every(message => message.endsWith(': invalid local source')));
    }
  });
});
test('validator:V2-02: actual link block preserves docs examples and valid skill sibling consumption', () => {
  withValidatorFixture(validate => {
    const failures = validate('./', {
      'docs/example.md': 'Runtime sibling example: `../ss-guardrails/core.md`.\n[Actual link](../skills/ss-guardrails/core.md)\n',
      'skills/ss-example/SKILL.md': 'Read `../ss-guardrails/core.md`.\n[Peer](../ss-guardrails/core.md)\n',
    });
    assert.deepEqual(failures, [], 'docs inline example is not a docs-relative link; real skill reference resolves');
  });
});
test('validator:V2-02: actual link block still rejects broken Markdown and skill sibling references', () => {
  withValidatorFixture(validate => {
    for (const [path, text, expected] of [
      ['docs/example.md', '[Broken](./missing.md)', 'dangling local link: ./missing.md'],
      ['docs/example.md', '[Broken](../ss-guardrails/core.md)', 'dangling local link: ../ss-guardrails/core.md'],
      ['docs/example.md', '[Ref][missing]\n[missing]: ./missing.md', 'dangling local link: ./missing.md'],
      ['skills/ss-example/SKILL.md', 'Read `../ss-guardrails/missing.md`.', 'dangling local link: ../ss-guardrails/missing.md'],
      ['skills/ss-example/SKILL.md', '[Broken](./missing.md)', 'dangling local link: ./missing.md'],
      ['docs/example.md', '[Outside](../../outside)', 'local link escapes bundle: ../../outside'],
      ['docs/example.md', '[Symlink escape](../escape)', 'local link escapes bundle: ../escape'],
      ['README.md', '[Broken](./missing.md)', 'dangling local link: ./missing.md'],
    ]) {
      assert.deepEqual(validate('./', { [path]: text }), [`${path}: ${expected}`]);
    }
  });
});
