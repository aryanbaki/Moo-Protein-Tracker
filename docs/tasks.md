# Tasks

Current handoff: [docs/status.md](status.md). This file retains foundation history
and the longer backlog; historical verification below is not a fresh check.

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

## Historical verification
The earlier foundation session recorded the following results on a GitHub-hosted
Ubuntu runner using Node.js 24 and npm, because that session could not resolve
the npm registry. See status.md for current verification.
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

## Cloud preparation completed (November 11, 2026)
- Preserved the current foundation and prepared EAS development/preview/production
  profiles with pinned tooling, separate update channels, and fingerprint policy.
- Installed SDK-compatible development client and updates libraries; OTA remains
  disabled pending authenticated project verification.
- Prepared one manual GitHub delivery workflow with closed gates and behavior
  tests, retained shared read-only CI, and added a safe read-only metadata lookup.
- Added docs/cloud-setup.md and docs/design.md; expanded shared agent handoffs,
  product validation assumptions, update/rollback guidance, and Apple setup steps.
- Local clean install, TypeScript, lint, iOS export, guard tests, schema, and
  workflow validation passed. Doctor is blocked on network; account/signing setup
  remains unverified. See status.md for exact current errors and results.

## Next steps
1. Use the published cloud environment in a fresh session; verify live Expo
   network/token access, rerun Doctor, and retrieve authenticated project metadata.
   Link only e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1 and confirm the real iOS bundle ID.
2. Finish the prepared update configuration and verify Apple signing, device
   registration, App Store Connect app/API key, and GitHub readiness gates.
3. Build and install an internal preview or TestFlight build; smoke-test on iPhone.
4. Agree on manual entry fields, goal controls, and calendar-day behavior.
5. Decide backup/export/restore and timezone rules, then implement local SQLite
   storage and migrations with meaningful logic tests.
6. Add logging, edit/delete, user-set goals, and daily history.
7. Replace the placeholder cow emoji and implement cow progress.

## Not yet verified
Native iOS compilation, signing, installation, and on-device visual/accessibility
behavior. JavaScript bundle export does not establish native build success.

## Deferred
Authentication, backend services, payments, AI features, cloud data sync.

## Unresolved dependency advisories
The final SDK 58 patch update reduced ten moderate findings to eight, with zero
high/critical. Current findings propagate from minimatch through Expo fingerprint
and TypeScript ESLint build/development tooling:
- https://github.com/advisories/GHSA-g3hv-75wg-m249

The earlier glob advisory (GHSA-3g3m-2fjr-6pw4) is no longer in the final audit.
The report still proposes an incompatible Expo SDK 52 downgrade for forced
remediation; this was not applied. No speculative overrides were added. Recheck
upstream SDK-compatible fixes before release. See status.md for the tooling vs
runtime assessment and actual audit evidence.
Expo-recommended ESLint 9.39.5 emits a support/deprecation warning; lint passes.
Migrate when Expo's lint configuration supports the newer major.
