# Tasks

## Completed
- Confirmed the repository was empty; initialized main with a minimal README to
  establish the base needed for a pull request. No existing work was overwritten.
- Initialized from Expo's official stable SDK 58 default template.
- Added React Native, Expo Router, strict TypeScript, and npm with a lockfile.
- Added the home route displaying “Moo” and “Your daily protein buddy.”
- Added reusable colors, spacing, and typography in src/theme.
- Added TypeScript, lint, and Expo Doctor scripts and cloud PR checks.
- Added shared AGENTS.md instructions and a CLAUDE.md pointer.
- Documented product scope, architecture, and planned local SQLite storage.
- Left Expo account linking, identifiers, credentials, and signing unconfigured.

## Verification
Validation runs on a GitHub-hosted Ubuntu runner using Node.js 24 and npm,
because this coding session cannot resolve the npm registry.
- npm ci: passed; confirms the committed manifest and lockfile install together.
- npm run typecheck: passed.
- npm run lint: passed.
- npm run doctor: passed (20/20 checks).
- iOS JavaScript bundle export: passed (1152 modules).

The official SDK 58 template did not include ESLint packages. Setup was corrected
to install lint tooling through Expo's SDK dependency resolver.
A temporary cloud bootstrap workflow generated the dependencies and lockfile;
it is removed from the final foundation. The retained checks workflow uses
read-only repository permissions and validates future pull requests.

## Next steps
1. Link the real Expo account and EAS project; choose the real iOS bundle ID.
2. Configure EAS cloud build profiles and Apple signing for a physical iPhone.
3. Build and install an internal preview or TestFlight build; smoke-test on iPhone.
4. Agree on manual entry fields, goal controls, and calendar-day behavior.
5. Implement local SQLite storage and migrations with meaningful logic tests.
6. Add logging, edit/delete, user-set goals, and daily history.
7. Replace the placeholder cow emoji and implement cow progress.

## Not yet verified
Native iOS compilation, signing, installation, and on-device visual/accessibility
behavior. JavaScript bundle export does not establish native build success.

## Deferred
Authentication, backend services, payments, AI features, cloud data sync.

## Unresolved dependency advisories
After a non-breaking `npm audit fix`, npm still reports 10 moderate dependency
findings (0 high, 0 critical), propagated from glob and minimatch through Expo's
CLI/fingerprint tooling and TypeScript ESLint tooling:
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249

npm's forced remediation proposes downgrading Expo to SDK 52. This was not applied:
it would break the current stable SDK requirement. No unverified dependency
overrides were added. Recheck upstream SDK-compatible fixes before release.
The Expo-recommended ESLint 9.39.5 also emits an upstream support/deprecation
warning; lint itself passes. Migrate when the Expo lint config supports the newer
ESLint major. CI actions use Node 24-compatible v6 revisions.
