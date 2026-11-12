import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const projectId = 'e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1';
export const actions = ['preview-build', 'production-build', 'testflight', 'preview-update', 'production-update'];

// Fail closed before invoking any EAS command that can mutate remote state.
export function validateDelivery({ action, confirmation, ref, config, eas, gates, tokenPresent, buildId }) {
  assert(actions.includes(action), 'Unknown delivery action');
  assert.equal(confirmation, action, 'Confirmation must exactly match the selected action');
  const production = !action.startsWith('preview-');
  if (production) assert.equal(ref, 'refs/heads/main', 'Production delivery requires main');
  assert(tokenPresent, 'EXPO_TOKEN is missing');
  assert.equal(gates.expo, 'true', 'Verified Expo identity gate is closed');
  assert.equal(config.extra?.eas?.projectId, projectId, 'Existing Expo project must be linked');
  assert(config.owner && config.slug, 'Authenticated owner and slug must be recorded');
  assert(config.ios?.bundleIdentifier, 'Verified iOS bundle identifier is missing');
  assert.equal(config.runtimeVersion?.policy, 'fingerprint', 'Fingerprint runtime policy is required');
  assert.equal(config.updates?.enabled, true, 'Update configuration is not activated');
  assert.equal(config.updates?.url, `https://u.expo.dev/${projectId}`, 'Unexpected update destination');
  const profile = production ? 'production' : 'preview';
  assert.equal(eas.build[profile].channel, profile, 'Build channel must match the environment');
  assert.equal(eas.build[profile].environment, profile, 'Build environment must be explicit');
  assert.equal(eas.build[profile].distribution, production ? 'store' : 'internal', 'Wrong distribution');
  if (action.endsWith('-update')) {
    assert.equal(gates.updates, 'true', 'Updates require a compatible installed and tested native build');
  } else {
    assert.equal(gates.signing, 'true', 'Apple signing readiness gate is closed');
  }
  if (action === 'testflight') {
    assert.equal(gates.submit, 'true', 'TestFlight submission readiness gate is closed');
    assert(/^\d+$/.test(eas.submit?.production?.ios?.ascAppId ?? ''), 'Verified numeric ascAppId is missing');
    assert(/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(buildId ?? ''), 'Select an explicit EAS build UUID');
  }
}

export function validateProject(remote, config) {
  assert.equal(remote.id, projectId, 'Authenticated project ID differs');
  assert.equal(remote.slug, config.slug, 'Authenticated project slug differs');
  assert.equal(remote.ownerAccount?.name, config.owner, 'Authenticated project owner differs');
}

export function validateSubmissionBuild(build, buildId, bundleIdentifier) {
  assert.equal(build.id, buildId, 'Build ID differs');
  assert.equal(build.app?.id, projectId, 'Build belongs to another project');
  assert.equal(build.platform, 'IOS', 'Submission requires iOS');
  assert.equal(build.status, 'FINISHED', 'Submission requires a finished build');
  assert.equal(build.distribution, 'STORE', 'Submission requires store distribution');
  assert.equal(build.buildProfile, 'production', 'Submission requires the production profile');
  assert.equal(build.appIdentifier, bundleIdentifier, 'Build bundle identifier differs');
  assert.equal(build.isForIosSimulator, false, 'Submission requires a physical-device binary');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = JSON.parse(readFileSync('app.json')).expo;
  const eas = JSON.parse(readFileSync('eas.json'));
  const env = process.env;
  const mode = process.argv[2];
  if (mode === 'project') {
    validateProject(JSON.parse(readFileSync(process.argv[3])), config);
  } else if (mode === 'build') {
    validateSubmissionBuild(JSON.parse(readFileSync(process.argv[3])), env.BUILD_ID, config.ios?.bundleIdentifier);
  } else {
    validateDelivery({
      action: env.DELIVERY_ACTION, confirmation: env.CONFIRMATION, ref: env.GITHUB_REF,
      config, eas, tokenPresent: Boolean(env.EXPO_TOKEN), buildId: env.BUILD_ID,
      gates: { expo: env.EXPO_VERIFIED, signing: env.SIGNING_READY, updates: env.UPDATES_READY, submit: env.SUBMIT_READY },
    });
  }
  console.log('Delivery preflight passed. No remote mutation performed by this check.');
}
