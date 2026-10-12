import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {isAbsolute, resolve} from 'node:path';
import {guardReleaseWrites, silentLogger, POLICY_ERROR} from './release-text.mjs';

export async function runReleaseAutomation(upstream, environment) {
  if (upstream?.VERSION !== '17.3.0' || typeof upstream.setLogger !== 'function' ||
      typeof upstream.GitHub?.create !== 'function' || typeof upstream.Manifest?.fromManifest !== 'function' ||
      typeof environment.GITHUB_REPOSITORY !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]+$/.test(environment.GITHUB_REPOSITORY) ||
      typeof environment.GH_TOKEN !== 'string' || !environment.GH_TOKEN) throw new Error(POLICY_ERROR);
  upstream.setLogger(silentLogger);
  const [owner, repo] = environment.GITHUB_REPOSITORY.split('/');
  const github = await upstream.GitHub.create({owner, repo, token: environment.GH_TOKEN, logger: silentLogger});
  guardReleaseWrites(github, environment.GITHUB_REPOSITORY);
  const manifest = () => upstream.Manifest.fromManifest(github, github.repository.defaultBranch,
    'release-please-config.json', '.release-please-manifest.json');
  await (await manifest()).createReleases();
  await (await manifest()).createPullRequests();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const {RELEASE_TOOL_PATH: toolPath, RUNNER_TEMP: temporaryPath} = process.env;
    if (!temporaryPath || !toolPath || !isAbsolute(temporaryPath) || !isAbsolute(toolPath) ||
        resolve(toolPath) !== resolve(temporaryPath, 'release-tool')) throw new Error(POLICY_ERROR);
    const require = createRequire(`${process.env.RELEASE_TOOL_PATH}/package.json`);
    await runReleaseAutomation(require('release-please'), process.env);
  } catch {
    // Never echo upstream exceptions, notes, repository context or credentials.
    console.error(POLICY_ERROR);
    process.exitCode = 1;
  }
}
