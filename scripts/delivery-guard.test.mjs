import assert from 'node:assert/strict';
import test from 'node:test';
import { projectId, validateDelivery, validateProject, validateSubmissionBuild } from './delivery-guard.mjs';

// Synthetic identities exercise release safety; these are not app configuration.
function ready(action = 'preview-build') {
  return {
    action, confirmation: action, ref: 'refs/heads/main', tokenPresent: true,
    gates: { expo: 'true', signing: 'true', updates: 'true', submit: 'true' },
    config: { owner: 'test-team', slug: 'test-app', extra: { eas: { projectId } },
      ios: { bundleIdentifier: 'test.fixture.app' }, runtimeVersion: { policy: 'fingerprint' },
      updates: { enabled: true, url: `https://u.expo.dev/${projectId}` } },
    eas: { build: {
      preview: { channel: 'preview', environment: 'preview', distribution: 'internal' },
      production: { channel: 'production', environment: 'production', distribution: 'store' },
    }, submit: { production: { ios: { ascAppId: '123456789' } } } },
    buildId: '11111111-2222-3333-4444-555555555555',
  };
}

test('allows each explicitly confirmed and ready action without executing it', () => {
  for (const action of ['preview-build', 'production-build', 'testflight', 'preview-update', 'production-update']) {
    assert.doesNotThrow(() => validateDelivery(ready(action)));
  }
});
test('blocks unconfirmed requests, absent credentials, and incomplete identity', () => {
  for (const mutate of [
    x => { x.confirmation = ''; }, x => { x.tokenPresent = false; },
    x => { x.gates.expo = ''; }, x => { delete x.config.owner; },
    x => { x.config.extra.eas.projectId = 'different-project'; },
    x => { delete x.config.ios.bundleIdentifier; }, x => { x.config.updates.enabled = false; },
  ]) {
    const input = ready(); mutate(input);
    assert.throws(() => validateDelivery(input));
  }
});
test('production actions reject feature branches; previews can use reviewed branches', () => {
  for (const action of ['production-build', 'testflight', 'production-update']) {
    const input = ready(action); input.ref = 'refs/heads/feature';
    assert.throws(() => validateDelivery(input), /requires main/);
  }
  const input = ready(); input.ref = 'refs/heads/feature';
  assert.doesNotThrow(() => validateDelivery(input));
});
test('readiness gates independently block builds, updates, and submission', () => {
  for (const [action, gate] of [['preview-build', 'signing'], ['production-update', 'updates'], ['testflight', 'submit']]) {
    const input = ready(action); input.gates[gate] = '';
    assert.throws(() => validateDelivery(input));
  }
});
test('rejects cross-channel configuration and incompatible runtime policy', () => {
  const input = ready('production-update'); input.eas.build.production.channel = 'preview';
  assert.throws(() => validateDelivery(input), /channel/);
  const other = ready(); other.config.runtimeVersion.policy = 'appVersion';
  assert.throws(() => validateDelivery(other), /Fingerprint/);
});
test('remote identity must match including team ownership', () => {
  const { config } = ready();
  const remote = { id: projectId, slug: config.slug, ownerAccount: { name: config.owner } };
  assert.doesNotThrow(() => validateProject(remote, config));
  remote.ownerAccount.name = 'another-account';
  assert.throws(() => validateProject(remote, config), /owner/);
});
test('submission requires an explicit finished production iOS build from this project', () => {
  const { buildId, config } = ready();
  const build = { id: buildId, app: { id: projectId }, platform: 'IOS', status: 'FINISHED', distribution: 'STORE', buildProfile: 'production', appIdentifier: config.ios.bundleIdentifier, isForIosSimulator: false };
  assert.doesNotThrow(() => validateSubmissionBuild(build, buildId, config.ios.bundleIdentifier));
  for (const patch of [{ id: 'other' }, { app: { id: 'other' } }, { platform: 'ANDROID' }, { status: 'ERRORED' }, { distribution: 'INTERNAL' }, { buildProfile: 'preview' }, { appIdentifier: 'other.app' }, { isForIosSimulator: true }]) {
    assert.throws(() => validateSubmissionBuild({ ...build, ...patch }, buildId, config.ios.bundleIdentifier));
  }
});
