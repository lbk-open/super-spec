import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {sanitizeReleaseText, guardReleaseWrites, POLICY_ERROR} from '../release-text.mjs';
import {runReleaseAutomation} from '../release-automation.mjs';

const context = 'example-owner/example-project';
const root = `https://github.com/${context}`;
const version = '## [0.2.0](' + root + '/compare/v0.1.0...v0.2.0) (2026-10-11)';
const notes = `${version}\n\n### Features\n\n* Preserve useful features ([#7](${root}/pull/7)) ([abcdef1](${root}/commit/abcdef1234567890))\n`;
const clean = '## 0.2.0 (2026-10-11)\n\n### Features\n\n* Preserve useful features (#7) (abcdef1)\n';
const footer = 'See [Release Please](https://github.com/googleapis/release-please#release-please).';

function client() {
  const calls = [];
  const api = {
    calls,
    async buildChangeSet(updates) {
      calls.push('build');
      const changes = new Map();
      for (const update of updates) {
        changes.set(update.path, {content: update.updater.updateContent('old'), originalContent: 'old', mode: '100644'});
      }
      return changes;
    },
    async createPullRequest(pr, branch, message, updates) {
      const changes = await this.buildChangeSet(updates, branch);
      calls.push({kind: 'branch-and-pr', pr, message, changes});
      return pr;
    },
    async updatePullRequest(number, pr, branch, options) {
      const changes = await this.buildChangeSet(pr.updates, branch);
      const body = (await options.pullRequestOverflowHandler.handleOverflow(pr)).toString();
      calls.push({kind: 'branch-and-pr-update', number, title: pr.title.toString(), body, changes});
    },
    async createRelease(release, options) {
      if (options?.forceTag) calls.push('tag');
      calls.push({kind: 'release', release});
      return {tagName: release.tag.toString(), url: `${root}/releases/tag/${release.tag}`};
    },
    async createFileOnNewBranch() { calls.push('archive'); },
    async commentOnIssue(body) { calls.push({kind: 'comment', body}); },
    async addIssueLabels(labels, number) { calls.push({kind: 'add-labels', labels, number}); },
    async removeIssueLabels(labels, number) { calls.push({kind: 'remove-labels', labels, number}); },
  };
  return api;
}
const updates = content => [{path: 'CHANGELOG.md', updater: {updateContent: () => content}}];
const tag = {toString: () => 'v0.2.0'};
const release = {notes, name: 'v0.2.0', tag, sha: 'a'.repeat(40), pullRequest: {number: 1}};
const title = {toString: () => 'chore(main): release 0.2.0'};

test('release text preserves features, version, date and labels; idempotent', () => {
  assert.equal(sanitizeReleaseText(notes, context), clean);
  assert.equal(sanitizeReleaseText(clean, context), clean);
  assert.equal(sanitizeReleaseText(footer, context), footer);
});

test('release text handles issue, compare, commit, PR and contextual references', () => {
  const inputs = [
    [`[0.2.0](${root}/compare/v0.1.0...v0.2.0)`, '0.2.0'],
    [`[#9](${root}/issues/9)`, '#9'],
    [`<${root}/pull/7>`, '#7'],
    [`${root}/commit/abcdef1234567890`, 'abcdef1'],
    [`${context}#7`, '#7'],
    [`${context}@abcdef1234567890`, 'abcdef1'],
    [`[#7][change]\n[change]: ${root}/pull/7\n`, '#7\n\n'],
    [`[#7][]\n[#7]: ${root}/pull/7\n`, '#7\n\n'],
    [`[#7]\n[#7]: ${root}/pull/7\n`, '#7\n\n'],
  ];
  for (const [input, expected] of inputs) assert.equal(sanitizeReleaseText(input, context), expected);
});

test('release policy rejects unknown and malformed input without echo', () => {
  const inputs = [null, 7, '', 'x'.repeat(65537),
    `[${context}](${root}/pull/7)`, `${root}/blob/main/README.md`,
    `${root}/pull/7?token=value`, `${root}/pull/%37`, `${root}/pull/7#fragment`,
    '[broken](https://invalid.example/docs', 'https://invalid.example/docs',
    '//invalid.example/docs', '<a href="https://invalid.example/docs">docs</a>',
    'file:///home/example/file', '/Users/example/private',
    'C:\\Users\\example\\file', '\u0000', '\ud800', 'example-owner in a feature',
    '[#7][missing]', `[x]: ${root}/pull/7\n[x]: ${root}/pull/8`,
    ['-----BEGIN', 'PRIVATE KEY-----'].join(' '), 'ghp_' + 'x'.repeat(40),
    `${root.replace('example-owner', 'example%2Downer')}/pull/7`,
  ];
  for (const input of inputs) assert.throws(() => sanitizeReleaseText(input, context), error => error.message === POLICY_ERROR);
});

test('guard completes full changeset before any PR/branch write and handles updater objects', async () => {
  const api = client(); guardReleaseWrites(api, context);
  const pr = {title: title.toString(), body: notes + footer, headBranchName: 'release-please--branches--main', labels: ['autorelease: pending']};
  await api.createPullRequest(pr, 'main', title.toString(), updates(notes));
  const write = api.calls[1]; assert.equal(write.kind, 'branch-and-pr');
  assert.equal(write.pr.body, clean + footer);
  assert.equal(write.changes.get('CHANGELOG.md').content, clean);
  assert.equal(write.message, title.toString());
  const update = {title, body: {toString: () => notes + footer}, updates: updates(notes), headRefName: 'release-please--branches--main', labels: ['autorelease: pending']};
  await api.updatePullRequest(2, update, 'main', {});
  assert.equal(api.calls.at(-1).body, clean + footer);
  assert.equal(api.calls.at(-1).title, title.toString());
});

test('unsafe title, body, message, metadata, update bytes or map shapes never write', async () => {
  for (const field of ['title', 'body', 'message', 'content', 'labels', 'headBranchName']) {
    const api = client(); guardReleaseWrites(api, context);
    const bad = 'https://invalid.example/unsafe';
    const pr = {title: field === 'title' ? bad : 'release 0.2.0', body: field === 'body' ? bad : notes,
      headBranchName: field === 'headBranchName' ? bad : 'release-branch', labels: field === 'labels' ? [bad] : []};
    await assert.rejects(api.createPullRequest(pr, 'main', field === 'message' ? bad : 'release 0.2.0', updates(field === 'content' ? bad : notes)), {message: POLICY_ERROR});
    assert.ok(api.calls.every(call => call === 'build'));
  }
  for (const change of [null, {content: Buffer.from('binary'), mode: '100644'}, {content: 'safe', mode: '120000'}, {content: 'safe', mode: '100644', extra: 'unsafe'}]) {
    const api = client(); api.buildChangeSet = async () => new Map([['CHANGELOG.md', change]]); guardReleaseWrites(api, context);
    await assert.rejects(api.buildChangeSet(updates(notes), 'main'), {message: POLICY_ERROR});
    assert.deepEqual(api.calls, []);
  }
});

test('all non-changelog generated files are validated, not silently rewritten', async () => {
  const api = client(); guardReleaseWrites(api, context);
  const safe = '{"$schema":"https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json","version":"0.2.0"}';
  const valid = await api.buildChangeSet([{path: '.release-please-manifest.json', updater: {updateContent: () => safe}}], 'main');
  assert.equal(valid.get('.release-please-manifest.json').content, safe);
  await assert.rejects(api.buildChangeSet([{path: 'package.json', updater: {updateContent: () => `{"url":"${root}/pull/7"}`}}], 'main'), {message: POLICY_ERROR});
  await assert.rejects(api.buildChangeSet([{path: '../escape', updater: {updateContent: () => clean}}], 'main'), {message: POLICY_ERROR});
});

test('current candidate release notes are checked before tag creation; history is never edited', async () => {
  const api = client(); guardReleaseWrites(api, context);
  await api.createRelease(release, {forceTag: true});
  assert.equal(api.calls[0], 'tag'); assert.equal(api.calls[1].release.notes, clean);
  assert.equal(api.calls[1].release.tag, tag); assert.equal(api.calls[1].release.sha, release.sha);
  const bad = client(); guardReleaseWrites(bad, context);
  await assert.rejects(bad.createRelease({...release, notes: notes + ' https://invalid.example/unsafe'}, {forceTag: true}), {message: POLICY_ERROR});
  assert.deepEqual(bad.calls, []);
});

test('overflow archives and unexpected comments are denied; expected completion comment is neutral', async () => {
  const api = client(); guardReleaseWrites(api, context);
  await assert.rejects(api.createFileOnNewBranch('release-notes.md', notes), {message: POLICY_ERROR});
  await assert.rejects(api.commentOnIssue('unexpected text', 1), {message: POLICY_ERROR});
  assert.deepEqual(api.calls, []);
  await api.createRelease(release, {});
  await api.commentOnIssue(`🤖 Created releases:\n\n- [v0.2.0](${root}/releases/tag/v0.2.0)\n\n:sunflower:`, 1);
  assert.equal(api.calls.at(-1).body, '🤖 Created releases:\n\n- v0.2.0\n\n:sunflower:');
  const completion = `🤖 Created releases:\n\n- [v0.2.0](${root}/releases/tag/v0.2.0)\n\n:sunflower:`;
  const wrongBefore = api.calls.length;
  await assert.rejects(api.commentOnIssue(completion, 2), {message: POLICY_ERROR});
  await assert.rejects(api.commentOnIssue(completion.replaceAll('v0.2.0', 'v0.3.0'), 1), {message: POLICY_ERROR});
  assert.equal(api.calls.length, wrongBefore);
  const failed = client(); failed.createRelease = async () => { throw new Error('remote rejected'); }; guardReleaseWrites(failed, context);
  await assert.rejects(failed.createRelease(release, {}));
  await assert.rejects(failed.commentOnIssue(completion, 1), {message: POLICY_ERROR});
  assert.deepEqual(failed.calls, []);
  await api.removeIssueLabels(['autorelease: pending'], 1);
  await api.addIssueLabels(['autorelease: tagged'], 1);
  assert.equal(api.calls.at(-1).kind, 'add-labels');
  const oversized = {title, body: {toString: () => 'x'.repeat(65537)}, updates: updates(notes), headRefName: 'release-branch'};
  const before = api.calls.length;
  await assert.rejects(api.updatePullRequest(1, oversized, 'main', {}), {message: POLICY_ERROR});
  assert.equal(api.calls.length, before);
});

test('entry point binds upstream version, APIs, silent logger and releases-before-PR order', async () => {
  const api = client(); api.repository = {defaultBranch: 'main'};
  const calls = [];
  const upstream = {VERSION: '17.3.0', setLogger(logger) { for (const value of Object.values(logger)) value('unsafe data'); },
    GitHub: {async create(options) { assert.equal(options.owner, 'example-owner'); assert.equal(options.repo, 'example-project'); calls.push('github'); return api; }},
    Manifest: {async fromManifest(github, branch, config, manifest) {
      assert.equal(github, api); assert.equal(branch, 'main'); assert.equal(config, 'release-please-config.json'); assert.equal(manifest, '.release-please-manifest.json');
      return {async createReleases() { calls.push('releases'); }, async createPullRequests() { calls.push('prs'); }};
    }},
  };
  await runReleaseAutomation(upstream, {GITHUB_REPOSITORY: context, GH_TOKEN: 'test-token'});
  assert.deepEqual(calls, ['github', 'releases', 'prs']);
  await assert.rejects(runReleaseAutomation({...upstream, VERSION: '17.4.0'}, {GITHUB_REPOSITORY: context, GH_TOKEN: 'test-token'}), {message: POLICY_ERROR});
  await assert.rejects(runReleaseAutomation(upstream, {}), {message: POLICY_ERROR});
});

test('trusted documentation, JSON arrays and complete old changelog are preserved', async () => {
  for (const url of ['https://nodejs.org/en/docs', 'https://docs.github.com/en/actions', 'https://docs.npmjs.com/cli/v10/commands/npm-ci']) {
    const input = `Read [documentation](${url})`;
    assert.equal(sanitizeReleaseText(input, context), input);
  }
  for (const input of ['[broken](https://nodejs.org/en/docs', 'mailto:example@example.invalid', 'www.example.invalid', '[x](https://nodejs.org/en/docs?tracking=1)']) {
    assert.throws(() => sanitizeReleaseText(input, context), {message: POLICY_ERROR});
  }
  const api = client(); guardReleaseWrites(api, context);
  const json = JSON.stringify({name: 'example-project', version: '0.2.0', files: ['skills/', 'docs/'], pi: {skills: ['./skills']}});
  const changes = await api.buildChangeSet([{path: 'package.json', updater: {updateContent: () => json}}, ...updates(notes + '\n## 0.1.0\n\n* Earlier feature\n')], 'main');
  assert.equal(changes.get('package.json').content, json);
  assert.equal(changes.get('CHANGELOG.md').content, clean + '\n## 0.1.0\n\n* Earlier feature\n');
});

test('unsupported updates, missing PR metadata and extra historical release headings fail before writes', async () => {
  for (const list of [[], [null], [{path: 'README.md', updater: {updateContent: () => 'text'}}], [{path: 'package.json', updater: {updateContent: null}}]]) {
    const api = client(); guardReleaseWrites(api, context);
    await assert.rejects(api.buildChangeSet(list, 'main'), {message: POLICY_ERROR});
    assert.deepEqual(api.calls, []);
  }
  const api = client(); guardReleaseWrites(api, context);
  await assert.rejects(api.createPullRequest({title: 'release 0.2.0', body: notes}, 'main', 'release 0.2.0', updates(notes)), {message: POLICY_ERROR});
  await assert.rejects(api.createRelease({...release, notes: notes + '\n## 0.1.0\n\n* Earlier feature\n'}, {}), {message: POLICY_ERROR});
  assert.deepEqual(api.calls, []);
});

test('additional malformed URL and updater option shapes fail closed', async () => {
  for (const input of ['https:/invalid.example/docs', 'http:invalid.example/docs', 'github.com/example-other/project/pull/7']) {
    assert.throws(() => sanitizeReleaseText(input, context), {message: POLICY_ERROR});
  }
  const api = client(); guardReleaseWrites(api, context);
  for (const update of [{...updates(notes)[0], createIfMissing: 'true'}, {...updates(notes)[0], unexpected: true}]) {
    await assert.rejects(api.buildChangeSet([update], 'main'), {message: POLICY_ERROR});
  }
  await assert.rejects(api.createPullRequest({title: 'release 0.2.0', body: notes, headBranchName: 'release-branch'}, 'main', 'release 0.2.0', updates(notes), {fork: true}), {message: POLICY_ERROR});
  assert.deepEqual(api.calls, []);
});

test('CLI failures never echo context, credentials, paths or upstream errors', () => {
  const entry = new URL('../release-automation.mjs', import.meta.url);
  for (const environment of [{}, {RUNNER_TEMP: '/var/example-runner', RELEASE_TOOL_PATH: '/var/example-runner/release-tool', GITHUB_REPOSITORY: context, GH_TOKEN: 'test-token'}]) {
    const result = spawnSync(process.execPath, [entry.pathname], {env: environment, encoding: 'utf8'});
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, POLICY_ERROR + '\n');
  }
});

test('workflow uses immutable upstream lock with existing token and canonical tests include this file', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/release-please.yml', import.meta.url), 'utf8');
  assert.match(workflow, /5c625bfb5d1ff62eadeeb3772007f7f66fdcf071/);
  assert.match(workflow, /npm ci --ignore-scripts --omit=dev/);
  assert.equal(workflow.match(/persist-credentials: false/g)?.length, 2);
  assert.match(workflow, /test ! -e "\$GITHUB_WORKSPACE\/\.release-tool" && test ! -L/);
  assert.match(workflow, /test ! -e "\$RUNNER_TEMP\/release-tool" && test ! -L/);
  assert.ok(workflow.indexOf('mv .release-tool') < workflow.indexOf('npm ci'));
  assert.match(workflow, /contents: write\n  pull-requests: write/);
  assert.doesNotMatch(workflow, /secrets\.|workflow_dispatch|googleapis\/release-please-action@/);
  assert.match(workflow, /GH_TOKEN: \$\{\{ github.token \}\}/);
  assert.match(workflow, /node scripts\/release-automation.mjs/);
  const validator = await readFile(new URL('../validate.sh', import.meta.url), 'utf8');
  assert.match(validator, /node --test scripts\/tests\/\*\.test\.mjs/);
  const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.ok(!pkg.files.some(path => path.startsWith('scripts') || path.startsWith('.github')));
});
