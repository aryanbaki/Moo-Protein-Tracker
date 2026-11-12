import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectId, validateProject } from './delivery-guard.mjs';

// Read-only lookup of the exact existing project. Never initializes a project.
try {
  assert(process.env.EXPO_TOKEN, 'EXPO_TOKEN is missing; use secure environment secrets');
  const response = await fetch('https://api.expo.dev/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.EXPO_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'query MooProject($appId: String!) { app { byId(appId: $appId) { id name slug fullName ownerAccount { name } } } }',
      variables: { appId: projectId },
    }),
    signal: AbortSignal.timeout(20000),
  });
  assert(response.ok, `Expo metadata request returned HTTP ${response.status} from api.expo.dev`);
  const result = await response.json();
  assert(!result.errors?.length, 'Expo rejected the metadata query; verify token permissions and project access');
  const project = result.data?.app?.byId;
  assert.equal(project?.id, projectId, 'Exact existing project was not returned');
  if (process.argv.includes('--verify')) {
    validateProject(project, JSON.parse(readFileSync('app.json')).expo);
    console.log('Authenticated Expo project ID, owner, and slug match app.json.');
  } else {
    // Only public project identity fields are printed, never authentication data.
    console.log(JSON.stringify(project, null, 2));
  }
} catch (error) {
  console.error(`Expo metadata verification failed (api.expo.dev): ${error.message}`);
  process.exitCode = 1;
}
