export const POLICY_ERROR = 'Release text validation failed.';
const fail = () => { throw new Error(POLICY_ERROR); };
const MAX_TEXT = 65536;
const VERSION = 'v?\\d+\\.\\d+\\.\\d+(?:-[A-Za-z0-9.-]+)?(?:\\+[A-Za-z0-9.-]+)?';
const versionPattern = new RegExp(`^${VERSION}$`);
const silent = Object.freeze(Object.fromEntries(['info', 'warn', 'error', 'debug', 'trace'].map(name => [name, () => {}])));
export const silentLogger = silent;

function repositoryContext(repository) {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]+$/.test(repository)) fail();
  const [owner, repo] = repository.split('/');
  return {owner, repo, root: `https://github.com/${repository}`};
}

function text(value, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && !value) || value.length > MAX_TEXT || !value.isWellFormed()) fail();
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)) fail();
  if (/\\|&#|%(?:[0-9a-f]{2})|(?:\/Users\/|\/home\/|\/tmp\/|\/private\/|[A-Za-z]:\/(?!\/))|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9_-]{32,})\b/i.test(value)) fail();
  return value;
}

function assertNoIdentity(value, context) {
  if (value.toLowerCase().includes(context.owner.toLowerCase())) fail();
}

// Exact upstream documentation/schema URLs and public documentation/registry
// hosts are retained. Repository links must be recognized, not merely stripped.
function allowedDocumentation(url) {
  return /^https:\/\/github\.com\/googleapis\/release-please(?:#release-please)?$/.test(url) ||
    /^https:\/\/raw\.githubusercontent\.com\/googleapis\/release-please\/main\/schemas\/(?:config|manifest)\.json$/.test(url) ||
    /^https:\/\/(?:nodejs\.org|docs\.github\.com|docs\.npmjs\.com)\/[A-Za-z0-9_./#-]+$/.test(url) ||
    /^https:\/\/registry\.npmjs\.org\/(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+\/-\/[A-Za-z0-9_.-]+\.tgz$/.test(url);
}

function destination(url, context, label) {
  text(url);
  if (allowedDocumentation(url)) {
    assertNoIdentity(url, context);
    return null;
  }
  const prefix = `${context.root}/`;
  if (!url.toLowerCase().startsWith(prefix.toLowerCase())) fail();
  const path = url.slice(prefix.length);
  let match;
  if ((match = /^(?:pull|issues)\/([1-9]\d*)$/.exec(path))) {
    const plain = `#${match[1]}`;
    if (label !== undefined && label !== plain) fail();
    return plain;
  }
  if ((match = /^commit\/([0-9a-f]{7,40})$/i.exec(path))) {
    if (label !== undefined && (!/^[0-9a-f]{7,40}$/i.test(label) || !match[1].toLowerCase().startsWith(label.toLowerCase()))) fail();
    return label ?? match[1].slice(0, 7);
  }
  if ((match = /^compare\/([^/]+)\.\.\.([^/]+)$/.exec(path))) {
    if (!versionPattern.test(match[1]) || !versionPattern.test(match[2])) fail();
    const plain = match[2].replace(/^v/, '');
    if (label !== undefined && label !== plain && label !== match[2]) fail();
    return label ?? plain;
  }
  fail();
}

export function sanitizeReleaseText(value, repository) {
  const context = repositoryContext(repository);
  let result = text(value);
  for (const match of result.matchAll(/\[[^\]\n]+\]\(/g)) {
    if (!/^\[[^\]\n]+\]\((<?https:\/\/[^\s()<>]+>?)\)/.test(result.slice(match.index))) fail();
  }
  const references = new Map();
  result = result.replace(/^ {0,3}\[([^\]\n]+)\]:[ \t]*(<?https:\/\/[^\s<>]+>?)[ \t]*$/gm, (_, id, raw) => {
    const key = id.toLowerCase();
    if (references.has(key)) fail();
    const url = raw.startsWith('<') ? raw.slice(1, -1) : raw;
    destination(url, context);
    references.set(key, url);
    return '';
  });
  result = result.replace(/\[([^\]\n]+)\]\[([^\]\n]*)\]/g, (_, label, id) => {
    const url = references.get((id || label).toLowerCase());
    if (!url) fail();
    const plain = destination(url, context, label);
    return plain ?? `[${label}](${url})`;
  });
  result = result.replace(/\[([^\]\n]+)\]\((<?https:\/\/[^\s()<>]+>?)\)/g, (_, label, raw) => {
    const url = raw.startsWith('<') ? raw.slice(1, -1) : raw;
    return destination(url, context, label) ?? `[${label}](${url})`;
  });
  result = result.replace(/\[([^\]\n]+)\](?!\()/g, (whole, label) => {
    const url = references.get(label.toLowerCase());
    if (!url) fail();
    return destination(url, context, label) ?? `[${label}](${url})`;
  });
  result = result.replace(/<https:\/\/[^\s<>]+>/g, whole => destination(whole.slice(1, -1), context) ?? whole);
  result = result.replace(/https:\/\/[^\s<>"'()[\]]+/g, url => destination(url, context) ?? url);
  const escaped = repository.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  result = result.replace(new RegExp(`${escaped}(?:#([1-9]\\d*)|@([0-9a-f]{7,40}))`, 'gi'), (_, issue, commit) => issue ? `#${issue}` : commit.slice(0, 7));
  text(result);
  assertNoIdentity(result, context);
  // Validate leftovers separately, so malformed or unrecognized link syntax
  // cannot bypass a successful substitution elsewhere in the same document.
  if (/(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/|\/\/)|\b(?:https?|mailto|data|javascript|file|ftp|ssh|git):|\b(?:www\.|github\.com\/)/i.test(result.replace(/https:\/\/[^\s<>"'()[\]]+/g, url => {
    if (!allowedDocumentation(url)) fail();
    return '';
  })) || /\]\[|\]\((?!https:\/\/)|\[[^\]\n]+\]:|<(?!\/?(?:details|summary)>|https:\/\/)[^\n>]*>/i.test(result)) fail();
  return result;
}

function validateGeneratedFile(value, context) {
  text(value);
  assertNoIdentity(value, context);
  const withoutUrls = value.replace(/https:\/\/[^\s<>"'()[\]]+/g, url => {
    if (!allowedDocumentation(url)) fail();
    return '';
  });
  if (/[A-Za-z][A-Za-z0-9+.-]*:\/\/|\/\/|\b(?:https?|mailto|data|javascript|file|ftp|ssh|git):|\b(?:www\.|github\.com\/)/i.test(withoutUrls)) fail();
  return value;
}

function serialization(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value.toString !== 'function' || value.toString === Object.prototype.toString) fail();
  return text(value.toString());
}

function metadata(value, context) {
  const result = text(value);
  assertNoIdentity(result, context);
  if (!/^[A-Za-z0-9_: .@/-]+$/.test(result) || result.includes('..') || result.includes('//') || result.includes('://')) fail();
  return result;
}

function options(value, keys) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.fork === true) fail();
  for (const [key, item] of Object.entries(value)) {
    if (!keys.includes(key) || (item !== undefined && typeof item !== 'boolean')) fail();
  }
  return value;
}

const generatedPaths = new Set(['CHANGELOG.md', 'package.json', 'package-lock.json', '.release-please-manifest.json', '.claude-plugin/plugin.json', '.codex-plugin/plugin.json']);

// These methods precede code-suggester's blob/branch/commit writes and upstream
// tag/Release writes in release-please 17.3.0. The version is bound by the runner.
export function guardReleaseWrites(github, repository) {
  const context = repositoryContext(repository);
  const names = ['buildChangeSet', 'createPullRequest', 'updatePullRequest', 'createRelease', 'createFileOnNewBranch', 'commentOnIssue', 'addIssueLabels', 'removeIssueLabels'];
  if (!github || names.some(name => typeof github[name] !== 'function')) fail();
  const original = Object.fromEntries(names.map(name => [name, github[name].bind(github)]));
  const sanitize = value => sanitizeReleaseText(value, repository);
  const validateUpdates = updates => {
    if (!Array.isArray(updates) || !updates.length) fail();
    for (const update of updates) {
      if (!update || typeof update !== 'object' || !generatedPaths.has(update.path) ||
          Object.keys(update).some(key => !['path', 'updater', 'createIfMissing', 'cachedFileContents'].includes(key)) ||
          (update.createIfMissing !== undefined && typeof update.createIfMissing !== 'boolean') ||
          !update.updater || typeof update.updater.updateContent !== 'function') fail();
    }
  };
  const validatePrMetadata = pr => {
    if (!pr || typeof pr !== 'object') fail();
    for (const key of ['headBranchName', 'headRefName', 'baseBranchName']) if (pr[key] !== undefined) metadata(pr[key], context);
    if (pr.labels !== undefined && (!Array.isArray(pr.labels) || pr.labels.some(label => { metadata(label, context); return false; }))) fail();
    if (pr.draft !== undefined && typeof pr.draft !== 'boolean') fail();
  };
  github.buildChangeSet = async (updates, branch) => {
    validateUpdates(updates); metadata(branch, context);
    const changes = await original.buildChangeSet(updates, branch);
    if (!(changes instanceof Map) || !changes.size) fail();
    const safe = new Map();
    for (const [path, change] of changes) {
      if (!generatedPaths.has(path) || !change || typeof change !== 'object' ||
          Object.keys(change).some(key => !['content', 'originalContent', 'mode'].includes(key)) || change.mode !== '100644' ||
          (change.originalContent !== null && typeof change.originalContent !== 'string')) fail();
      const content = text(change.content);
      const sanitized = path === 'CHANGELOG.md' ? sanitize(content) : validateGeneratedFile(content, context);
      safe.set(path, {...change, content: sanitized});
    }
    return safe;
  };
  github.createPullRequest = async (pr, branch, message, updates, suppliedOptions) => {
    validatePrMetadata(pr); metadata(pr.headBranchName, context); metadata(branch, context); validateUpdates(updates);
    const safePr = {...pr, title: sanitize(serialization(pr.title)), body: sanitize(serialization(pr.body))};
    const safeMessage = sanitize(serialization(message));
    return original.createPullRequest(safePr, branch, safeMessage, updates, options(suppliedOptions, ['fork', 'draft']));
  };
  github.updatePullRequest = async (number, pr, branch, suppliedOptions = {}) => {
    if (!Number.isSafeInteger(number) || number < 1) fail();
    validatePrMetadata(pr); metadata(pr.headRefName, context); metadata(branch, context); validateUpdates(pr.updates);
    if (!suppliedOptions || typeof suppliedOptions !== 'object' || Array.isArray(suppliedOptions) ||
        Object.keys(suppliedOptions).some(key => !['fork', 'signoffUser', 'pullRequestOverflowHandler'].includes(key)) || suppliedOptions.signoffUser) fail();
    options({fork: suppliedOptions.fork}, ['fork']);
    const safePr = {...pr, title: sanitize(serialization(pr.title)), body: sanitize(serialization(pr.body))};
    const safeOptions = {...suppliedOptions, fork: false, pullRequestOverflowHandler: {async handleOverflow(candidate) { return sanitize(serialization(candidate.body)); }}};
    return original.updatePullRequest(number, safePr, branch, safeOptions);
  };
  const completed = new Map();
  github.createRelease = async (release, suppliedOptions) => {
    if (!release || !/^[0-9a-f]{40}$/i.test(release.sha) || !Number.isSafeInteger(release.pullRequest?.number) || release.pullRequest.number < 1) fail();
    const tag = serialization(release.tag);
    if (!versionPattern.test(tag)) fail();
    const notes = sanitize(release.notes);
    const headings = [...notes.matchAll(/^#{1,3} (v?\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?)(?:\s|$)/gm)];
    if (headings.length !== 1 || headings[0][1].replace(/^v/, '') !== tag.replace(/^v/, '')) fail();
    const safeRelease = {...release, notes, name: release.name === undefined ? undefined : sanitize(release.name)};
    const result = await original.createRelease(safeRelease, options(suppliedOptions, ['forceTag', 'draft', 'prerelease']));
    if (!result || result.tagName !== tag || result.url !== `${context.root}/releases/tag/${tag}`) fail();
    completed.set(tag, {url: result.url, pullNumber: release.pullRequest.number});
    return result;
  };
  for (const name of ['addIssueLabels', 'removeIssueLabels']) {
    github[name] = async (labels, number) => {
      if (!Number.isSafeInteger(number) || number < 1 || !Array.isArray(labels) || !labels.length) fail();
      for (const label of labels) metadata(label, context);
      return original[name](labels, number);
    };
  }
  github.createFileOnNewBranch = async () => fail();
  github.commentOnIssue = async (comment, number) => {
    if (!Number.isSafeInteger(number) || number < 1) fail();
    const match = /^🤖 Created releases:\n\n(- \[[^\]\n]+\]\(https:\/\/[^\s)]+\)(?:\n- \[[^\]\n]+\]\(https:\/\/[^\s)]+\))*)\n\n:sunflower:$/.exec(text(comment));
    if (!match) fail();
    const lines = match[1].split('\n').map(line => {
      const item = /^- \[([^\]]+)\]\(([^)]+)\)$/.exec(line);
      const success = completed.get(item[1]);
      if (!versionPattern.test(item[1]) || success?.url !== item[2] || success.pullNumber !== number) fail();
      return `- ${item[1]}`;
    });
    const safeComment = sanitize(`🤖 Created releases:\n\n${lines.join('\n')}\n\n:sunflower:`);
    return original.commentOnIssue(safeComment, number);
  };
  return github;
}
