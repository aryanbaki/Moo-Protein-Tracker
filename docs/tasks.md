# Tasks

Current handoff: [docs/status.md](status.md). This file retains foundation history,
the v1 milestones, and what is needed from the owner; historical verification
below is not a fresh check.

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
  workflow validation passed. After SDK patch correction, GitHub CI also passed
  all checks including Doctor 20/20 and iOS export. Local Codex network/token
  access remains blocked; account/signing setup is unverified. See status.md.

## Direction change (v1 scope)
The owner replaced the foundation's small scope (local-only manual protein and
creatine gram logging, no accounts, backend, payments, or AI, static cow) with
the v1 direction in [product.md](product.md): protein-first tracking with an
animated SVG cow, full onboarding, photo and barcode scanning, Supabase accounts
and sync, and a RevenueCat paywall. The older "Next steps" (agree manual entry
fields, static cow) and the old "Deferred" list (authentication, backend,
payments, AI, cloud sync) no longer apply. Sections above are kept as history.

## Milestones
Progress and evidence for each milestone belong in [status.md](status.md); this
list is the plan, not a record of completion.

1. **Base**: add dependencies, extend the theme, load fonts, navigation skeleton,
   Jest setup, and rewrite product/design/architecture/tasks docs to this scope.
2. **Cow**: SVG cow, poses, fill effect, UFO scene, confetti; a dev gallery route
   to view every pose; icon and splash generated from the artwork.
3. **Onboarding**: all screens, goal math with tests, reality check, creatine
   branch, UFO loading, plan screen.
4. **Core loop**: SQLite storage with migrations, Home, quick add, manual entry,
   edit/delete, day/week fill, streaks, creatine check-off, with tests.
5. **Scanner**: camera, barcode lookup, result sheet, mock analyser, Supabase
   edge function.
6. **Accounts and sync**: Supabase project and tables, auth screens, sync,
   delete account.
7. **Paywall**: RevenueCat wiring, paywall screen, scan allowance gating.
8. **Progress and Settings**, reminders, polish, accessibility pass.

Milestones 1–4 need nothing from the owner. 5–7 run on mocks until the items
below exist.

## Needed from the owner
Not blocking the start, but nothing that depends on them can be verified first.
- Anthropic API key, added as a Supabase secret (for photo scans). Never in the
  repository or the app.
- OK to create a Supabase project for Moo, and which organisation it belongs to.
- RevenueCat account and iOS API key, plus the prices and trial length.
- Apple Developer account, bundle identifier, and App Store Connect products.
  Required for Sign in with Apple, purchases, and any phone build.
- Privacy policy and terms URLs for the paywall.

## Still open from the foundation
- Confirm the real iOS bundle identifier and Apple team from authoritative
  records; none is configured.
- Finish the prepared update configuration and verify Apple signing, device
  registration, App Store Connect app/API key, and GitHub readiness gates.
- Build and install an internal preview or TestFlight build and smoke-test on an
  iPhone. The v1 native modules and config plugins mean a new native build is
  required; this remains a separately authorised step.
- Doctor network access to exp.host/reactnative.directory needed repair in the
  cloud environment when last recorded.
- Add `npm test` to .github/workflows/checks.yml so CI runs the Jest suite.
- Decide export format and what happens to signed-out local data on uninstall.

## Not yet verified
Native iOS compilation, signing, installation, and on-device visual/accessibility
behavior. JavaScript bundle export does not establish native build success.
Also not verified: the v1 native dependency set in a native build, the real
camera, notifications, purchases, Sign in with Apple, on-device animation and
Reduce Motion, VoiceOver, a deployed Supabase project, and the edge function
against the live Anthropic API.

## Deferred
Social features, wearables and Apple Health, Android and web as products, meal
plans and recipes, iPad layouts. See [product.md](product.md).

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
