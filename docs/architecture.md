# Architecture

This document covers the foundation (stack, EAS, delivery, updates) and the v1
app design that sits on top of it. The product direction is in
[product.md](product.md). The section "What is implemented" separates what
exists in the tree from what still needs owner-provided accounts and keys.
[status.md](status.md) holds the current verified results.

## Stack
Expo SDK 58 (58.0.24) with React Native 0.88.1, React 19.3.0, strict TypeScript,
and Expo Router ~58.0.31. Node.js 24 LTS is selected by .nvmrc and CI;
package.json requires Node >=24. TypeScript ~6.0.3 uses strict checking. npm is the only
package manager. The lockfile records the actual resolved dependency versions.
The foundation uses stable SDK 58, initialized from Expo's official default template.

### Dependencies added for v1
Versions are the ranges in package.json; the lockfile has the resolved versions.

| Area | Packages |
| --- | --- |
| Animation, gestures, drawing | react-native-reanimated 4.7.1, react-native-worklets 0.13.0, react-native-gesture-handler ~3.3.0, react-native-svg 15.16.0 |
| State and local storage | zustand ^5.1.0, @react-native-async-storage/async-storage 2.2.0, expo-sqlite ~58.0.16, expo-secure-store ~58.0.3, expo-crypto ~58.0.8 |
| Scanning | expo-camera ~58.0.14, expo-image-picker ~58.0.10, expo-image-manipulator ~58.0.16 |
| Reminders and feedback | expo-notifications ~58.1.9, expo-haptics ~58.0.8 |
| Fonts | @expo-google-fonts/nunito ^0.4.2, expo-font ~58.0.11 |
| Accounts and backend | @supabase/supabase-js ^2.119.0, expo-apple-authentication ~58.0.3 |
| Purchases | react-native-purchases ^11.0.2 |
| Web checks | react-dom 19.3.0, react-native-web ~0.21.4 |
| Tests (dev) | jest ~30.5.2, jest-expo ~58.0.14, @testing-library/react-native ^14.1.0, @types/jest 30.0.0 |

Add native dependencies with `npx expo install` so versions match the SDK.

### These are native changes
Most of the packages above contain native code, and app.json now carries config
plugins and iOS settings for them: plugins `expo-sqlite`, `expo-secure-store`,
`expo-camera` (camera permission text), `expo-image-picker` (photo permission
text), `expo-notifications`, `expo-apple-authentication`, and `expo-font`;
`NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`; and
`ios.usesAppleSignIn: true`.

Consequences:
- **A new native build is required before any of this reaches a phone.** No
  build made before these changes can run this JavaScript, and an OTA update
  cannot deliver it. The fingerprint runtime policy changes with the native
  dependency set, which is the intended safeguard.
- No native build of this dependency set has been made or verified. `npm run
  export:ios` and the web export check JavaScript bundling only.
- Starting a build is still a separately authorised step (see Cloud workflow
  and AGENTS.md), and still needs the pending bundle identifier and signing.

## Folder structure
Present in the tree:
- src/app/_layout.tsx: root layout. Loads Nunito, waits for the profile store
  and log store, hides the splash screen, and gates routes with
  `Stack.Protected`: `(onboarding)` until onboarding is complete; then `(tabs)`,
  `scan` (full-screen modal) and `entry` (modal). `paywall` and `auth` are modals
  reachable in both states.
- src/app/(onboarding)/: onboarding stack, one question per route.
- src/app/(tabs)/: Home (`index`), `progress`, `settings`.
- src/app/scan/, src/app/entry/, src/app/auth/, src/app/paywall.tsx: scan flow,
  add/edit entry, sign-in, paywall.
- src/components/index.tsx: shared UI primitives (`AppText`, `Screen`, `Button`,
  `Card`, `OptionCard`, `ProgressBar`).
- src/mascot/: the cow (`Cow`, `UfoScene`, `SpeechBubble`, `Confetti`).
- src/features/: feature logic. `log`, `billing`, `auth`, `reminders`, and
  `scan` existed in the base; more are listed under What is implemented.
- src/state/profile.ts: persisted profile store.
- src/lib/: `date.ts` (local calendar-day helpers, tested), `id.ts` (UUIDs via
  expo-crypto), `supabase.ts` (lazily created client, or null when unconfigured).
- src/theme/index.ts: colours, spacing, radius, fonts, type sizes, shadow.
- src/types.ts: shared domain types; dependency-free.
- supabase/: backend code that is deployed to Supabase, not bundled in the app.
  Excluded from the app's TypeScript project and from Jest.
- .env.example: the public client variables (see Environment variables).
- docs/product.md, docs/design.md: product direction and design rules.
- docs/status.md: current verified handoff, blockers, and next task.
- docs/tasks.md: foundation history, milestones, and owner inputs.
- AGENTS.md / CLAUDE.md: shared session rules and Claude Code entry point.
- package.json / package-lock.json: scripts and dependency resolution.
- tsconfig.json / eslint.config.js: TypeScript and Expo ESLint configuration.
- .github/workflows/checks.yml: cloud guard tests, TypeScript, lint, Expo
  Doctor, and iOS JavaScript export checks.
- app.json: Moo display name, moo-protein-tracker slug, moo URL scheme,
  portrait/light UI, iPhone-only configuration, and the plugins listed above.
  Verified owner aryanbakis-team and the existing extra.eas.projectId are
  configured; ios.bundleIdentifier remains pending.
- eas.json: pinned EAS CLI, development/preview/production build profiles and a
  pending production submission profile.
- .github/workflows/delivery.yml: manual delivery with closed readiness gates.
- scripts/: read-only Expo metadata lookup and tested delivery preflight guards.
- docs/cloud-setup.md: practical cloud/Apple runbook.
- No native ios/android directories are committed.

Planned layout from the v1 plan. Folders not listed above did not exist when this
was written; create them when the feature is built:

```
src/app/            _layout.tsx (gate), (onboarding)/, (tabs)/, scan/, entry/, auth/, paywall.tsx
src/components/     shared UI: buttons, sheets, pickers, progress, macro tiles, charts
src/mascot/         cow SVG parts, fill effect, UFO scene, poses, animation hooks
src/features/       goals/ (calc, guard rails), log/ (entries, totals, streaks),
                    scan/ (camera, API client, barcode), creatine/, reminders/,
                    billing/, auth/, sync/
src/storage/        SQLite database, versioned migrations, repositories
src/state/          small persisted app state
src/theme/          design tokens
supabase/           migrations/, functions/analyze-food/
assets/             icon and splash generated from the cow artwork
```

Keep routes thin: screens compose components and call feature modules. Screens
must not issue SQL, call Supabase tables, or call RevenueCat directly.

## State and data
Two kinds of state, deliberately separate:

- **Profile store** (`useProfile`, src/state/profile.ts): a zustand store
  persisted with AsyncStorage under the key `moo.profile.v1` (localStorage on
  web). Holds onboarding answers, the last onboarding step (to resume mid-flow),
  goals, units, creatine settings, and notification preferences. `hydrated`
  becomes true after rehydration and is not persisted.
- **Log store** (`useLog`, src/features/log): food entries, creatine check-offs,
  and weight logs, exposed through a zustand store with async actions. On native
  it is backed by SQLite (expo-sqlite) so the app works offline and survives
  restarts; SQL lives behind a storage module with versioned migrations and
  typed repositories. On web, which is only used for checks, the same repository
  contract is backed by one JSON document in AsyncStorage (localStorage); Metro
  resolves a `.web.ts` driver so expo-sqlite is not loaded there.

Rules that hold whatever the storage:
- An entry keeps the local calendar day (`YYYY-MM-DD`) it was logged on. The day
  is stored, never recomputed, so a timezone change does not move old entries.
  Day arithmetic goes through src/lib/date.ts, which works at local noon to stay
  clear of daylight-saving edges.
- Entries carry created/updated/deleted timestamps; deletes are soft so they can
  sync.
- Daily totals, streaks, and cow progress are derived from entries and goals,
  never stored. A missing or zero goal must not cause a division error.
- Validate positive, finite amounts and goal inputs before saving.
- Local SQLite is the source of truth. Sync, when signed in, pushes and pulls
  changed rows; last write wins on `updated_at`.

Still to decide before launch: export format, what happens to local data on
uninstall or device loss for signed-out users, restore validation, and
migration compatibility across app versions. Do not assume cloud build
infrastructure backs up users' local data.

## Contracts between features
Features are built by different sessions, so they meet at small exported
contracts. Keep exported names and signatures stable; add exports rather than
changing them. A module whose header says "BASE STUB" has the final interface
with placeholder internals.

| Module | Contract |
| --- | --- |
| src/types.ts | `OnboardingAnswers`, `Goals`, `CreatineSettings`, `FoodEntry`, `NewFoodEntry`, `DayTotals`, `CreatineLog`, `WeightLog`, `ScannedItem`, `ScanResult`, and the answer unions |
| src/state/profile.ts | `useProfile`: answers, goals, units, creatine, reminders flags and their setters; `completeOnboarding`, `resetProfile` |
| src/features/log | `useLog`: `init`, `addEntry`, `updateEntry`, `deleteEntry`, `setCreatineTaken`, `logWeight`, `clearAll`; pure helpers `totalsForDay`, `currentStreak` |
| src/features/goals | pure goal calculation (`computeGoals`) and guard rails (`checkGoals`) returning a verdict per goal: `ok`, `low`, `high`, or `blocked` |
| src/features/scan | photo analysis and barcode lookup returning a `ScanResult`; a mock analyser for use without keys |
| src/features/billing | `useBilling` (`isPremium`, `photoScansUsed`), `FREE_PHOTO_SCANS` (3), `canPhotoScan`, `presentPaywall(reason)` |
| src/features/auth | `useAuth`: `ready`, `user`, `backendConfigured`, `signOut` |
| src/features/reminders | `requestNotificationPermission`, `syncReminders` (re-schedules local notifications from the profile; safe to call repeatedly) |
| src/mascot | `Cow` (`pose`, `progress`, `showFill`, `headOnly`, `accessibilityLabel`), `UfoScene`, `SpeechBubble`, `Confetti`, `CowPose` |
| src/lib/supabase.ts | `supabaseConfigured`, `getSupabase()` (null when unconfigured) |

How they connect: onboarding writes answers to the profile store and asks the
goals module for goals. Home reads the log store and profile goals and derives
totals and progress. The scan flow checks `canPhotoScan`, gets a `ScanResult`,
lets the user edit it, saves through `addEntry`, and records a photo scan.
Settings re-runs the guard rails and calls `syncReminders` after changes.
Everything must keep working when `backendConfigured` is false.

## Backend: Supabase
Supabase provides accounts, sync storage, and the server side of photo scans.

- **Auth**: Sign in with Apple (expo-apple-authentication) and email one-time
  code. On native the session is stored through expo-secure-store; on web the
  client's default storage is used. Account deletion must be available in-app.
- **Tables** (supabase/migrations/0001_init.sql): `profiles` (goals, answers,
  and settings, plus a server-owned `photo_scans_used` counter), `food_entries`,
  `creatine_logs`, and `weight_logs`. Every table has row-level security enabled
  with owner-only policies, so a signed-in user can read and write only their
  own rows. The app uses the anon (publishable) key, which is safe to ship only
  because RLS is on. Schema changes go in new migration files.
- **Edge function `analyze-food`** (supabase/functions/analyze-food): verifies
  the caller's JWT, checks the scan allowance, sends the downscaled photo to the
  Anthropic API, and returns structured items (name, portion, protein, calories,
  carbs, fat, confidence). The model ID has a default in the function and can be
  overridden with the `ANTHROPIC_MODEL` secret. The app never calls the
  Anthropic API itself; it sends a JPEG downscaled to at most 1024 px on the
  longest edge.
- **Edge function `delete-account`** (supabase/functions/delete-account):
  deletes the calling user's rows and auth user, identified from the verified
  JWT only.
- `profiles.is_premium` is server-owned (app roles cannot write it). The piece
  that sets it from a RevenueCat purchase on the server is not in this
  repository, so server-side premium for scans is still to be wired.
- Deployment steps are in [supabase/README.md](../supabase/README.md). Nothing
  has been deployed; no Supabase project is recorded for Moo.
- **Secrets**: the Anthropic API key and the Supabase service-role key live only
  in Supabase secrets. They must never be in the repository, in `.env.example`,
  in an `EXPO_PUBLIC_` variable, or in the app bundle. Anything with the
  `EXPO_PUBLIC_` prefix is compiled into the JavaScript bundle and is public.
- **Barcodes** do not need the backend: the app looks products up in Open Food
  Facts by code.
- The free-scan allowance is enforced on the server for signed-in users through
  `photo_scans_used`; the local counter in the billing store is a convenience,
  not a control.

## Purchases: RevenueCat
`react-native-purchases` reads offerings from the RevenueCat dashboard, so
prices and trial length are not hard-coded. The paywall shows yearly and monthly
options, restore, and terms/privacy links, and can be closed. Premium state is
exposed through `useBilling().isPremium`. The RevenueCat public iOS SDK key is a
client key and may ship in the app; RevenueCat secret keys may not. Purchases
cannot run on web or without App Store Connect products, so those paths use the
free tier.

## Environment variables
From `.env.example`. Copy it to `.env` (ignored by Git) for local work; for
cloud builds set the same names in the EAS environment for the profile. All four
are public client configuration and end up in the bundle.

| Variable | Purpose | When blank |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | App runs local-only: no sign-in, sync, or server photo analysis |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key | Same as above; both are needed |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat public iOS SDK key | No purchases; everyone is on the free tier |
| `EXPO_PUBLIC_MOCK_SCAN` | Set to `1` to force the mock food analyser even when Supabase is configured | Mock is used only when Supabase is not configured |

There is no client variable for the Anthropic key, by design. The billing code
also reads an optional `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`; it is not in
`.env.example` because Android is not a product target.

## Tests
- `npm test` runs Jest with the `jest-expo` preset. Tests sit next to the code
  as `*.test.ts(x)`. `/scripts/` and `/supabase/` are ignored by Jest.
- `npm run test:setup` is separate: Node's test runner over the delivery guard
  script.
- Pure logic must have tests: goal math, guard rails, totals, streaks, day
  boundaries, storage migrations, reminder scheduling, and scan-result
  sanitising.
- Checks that only a device can give (camera, notifications, purchases, Sign in
  with Apple, motion, VoiceOver) are not covered by Jest or the web export.
- `.github/workflows/checks.yml` did not run `npm test` when this was written;
  add it there so CI covers product logic.

## What is implemented
This is a snapshot of the working tree taken while the v1 app work was still
being written by several builders, on top of the shared base commit. "Present"
means the files exist; it does not mean the feature was run on a phone, and it
is not a test result. Check the tree and [status.md](status.md) for the current
state and for which checks actually passed.

Present in the tree (code written, runs without any account or key):

| Area | Where | Notes |
| --- | --- | --- |
| Dependencies, plugins, theme, fonts, navigation gate, Jest config | package.json, app.json, src/theme, src/app/_layout.tsx | Base commit |
| Shared UI | src/components (`index.tsx`, `Sheet`, `WheelPicker`, `LineChart`, `BarChart`, `ComparisonChart`) | |
| Cow artwork and animation | src/mascot (`Cow`, `CowFill`, `Ufo`, `Confetti`, `SpeechBubble`, `poses`, `art`), pose gallery at src/app/dev/gallery.tsx | Replaces the emoji stub |
| Goal math and guard rails | src/features/goals (`calc.ts` with tests) | |
| Onboarding | src/app/(onboarding)/, src/features/onboarding | Question screens, creatine branch, notifications, UFO loading, plan, and reality check. No create-account step route was present at the snapshot; sign-in lives at src/app/auth/ |
| Local storage | src/storage (SQLite repository and migrations for native, JSON repository for web, tests) | |
| Log store, totals, streaks, validation | src/features/log (with tests) | Backed by src/storage |
| Home, entry, progress, settings screens | src/app/(tabs)/, src/app/entry/, src/app/settings/, src/features/home, src/features/progress, src/features/settings | |
| Creatine helpers | src/features/creatine (with tests) | |
| Reminders | src/features/reminders (local notifications; schedule logic tested) | No-op on web or without permission |
| Scan client | src/app/scan/, src/features/scan (photo analysis client, Open Food Facts barcode lookup, mock analyser, sanitising, tests) | Uses the mock analyser until Supabase is configured |
| Accounts client | src/features/auth, src/app/auth/ | Local-only (never signed in) until Supabase is configured |
| Sync client | src/features/sync | Inactive until signed in |
| Paywall and billing client | src/features/billing, src/app/paywall.tsx | Preview mode with no prices until a RevenueCat key and products exist |
| Backend source | supabase/migrations/0001_init.sql, supabase/functions/analyze-food, supabase/functions/delete-account, [supabase/README.md](../supabase/README.md) | Source only; not deployed |

Also present: assets/icon.png and assets/splash-icon.png with
scripts/generate-icons.mjs, which generates them from the cow artwork. At the
snapshot app.json did not yet reference them. Not present: `npm test` in the CI
workflow.

Needs owner-provided accounts or keys before it can work or be verified:

| Capability | Needs |
| --- | --- |
| Real photo analysis | A Supabase project with the migration applied and `analyze-food` deployed, and an Anthropic API key set as the Supabase secret `ANTHROPIC_API_KEY` |
| Sign-in, sync, account deletion | The Supabase project, its URL and anon key in the app environment, Apple and email providers configured in Supabase |
| Sign in with Apple on a device | Apple Developer account, a confirmed bundle identifier, and the capability on the app ID |
| Purchases and real prices | RevenueCat account and public iOS key, App Store Connect products, prices and trial length |
| Paywall legal links | Privacy policy and terms URLs |
| Anything on a phone | Bundle identifier, signing, and a separately authorised new EAS build |

Not verified by anything in this repository: a native build with the v1
dependency set, the camera, notifications, purchases, Sign in with Apple,
on-device animation, VoiceOver, a deployed database with its RLS policies, and
the edge function against the live Anthropic API.

## Cloud workflow
Codex and Claude Code share AGENTS.md. A cloud coding environment can install
dependencies and run checks. EAS builds and signs native binaries in the cloud
after account linking and Apple signing are configured in a later step.
Preview/production binaries bundle JavaScript and do not need a laptop or Metro
server to remain running. Interactive Metro development still needs an active
development environment.

### Existing Expo project and app identity
Existing user-supplied Expo project ID:
`e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1`. Known username: `aryanbaki`;
user-reported dashboard title: “Moo: Protein Tracker”. Authenticated owner is `aryanbakis-team` and slug is
`moo-protein-tracker`, verified through the exact-project API query. The current local name “Moo”, slug
“moo-protein-tracker”, URL scheme “moo”, version 1.0.0, portrait/light UI, and
supportsTablet=false are retained. Expo resolves default platforms to iOS, Android,
and web because no platforms override is set; only iOS delivery is prepared, and
Android/web product support is outside the launch scope. No new app or Expo project was initialized.

The read-only `npm run expo:project` looks up the exact ID. The returned owner/slug
and project ID are now recorded in app.json and the resolved config is verified.
Next, confirm any existing bundle identifier in Expo/Apple. Never infer Apple
Team ID or App Store Connect numeric app ID from an Expo account. No permanent
bundle ID, Apple Team ID, or ascAppId is configured. See the cloud runbook for the
proposed bundle ID (pending existing-identifier checks and owner confirmation).

### Native build profiles and delivery
GitHub Actions is the single delivery orchestrator; EAS performs cloud compilation,
signing, and uploads. No competing Expo Workflow is configured. checks.yml handles
PR/main checks. delivery.yml is workflow_dispatch-only; it does not execute from
pushes. It separates preview-build, production-build, testflight, preview-update,
and production-update with exact confirmation, readiness gates, and production
main-branch restrictions. Environment reviewer/branch protection setup remains an
owner action. The guard rechecks authenticated project metadata; submissions also
validate the exact finished production iOS build and project rather than “latest”.

EAS CLI **27.7.2** is pinned in eas.json and commands, invoked through npx outside
app dependencies. Node 24 LTS is consistent across .nvmrc/CI, with cloud build
Node pinned to **24.22.1**. EAS-managed iOS images are not yet validated by a native
build; choose a supported Xcode image in a future build task if needed. Version
source is remote; production auto-increments the build number when an authorized
build is started. requireCommit=true keeps submitted source committed.

| Profile | Purpose | Distribution / environment / channel |
| --- | --- | --- |
| development | expo-dev-client debugging; Metro may be required | internal / development / no release channel |
| preview | Installable binary with bundled JavaScript | internal / preview / preview |
| production | App Store/TestFlight binary; upload is separate | store / production / production |

`expo-dev-client ~58.0.19` and `expo-updates ~58.0.22` were selected through the
installed SDK 58 bundled compatibility map after CI identified newer supported
SDK 58 patches. The SDK versioned docs describe the compatibility/install process;
CI Doctor provides the current remote compatibility check.
expo-sqlite and the other v1 native modules are now installed (see Dependencies
added for v1). ios/ and android/ remain
generated by Expo/EAS rather than committed. Internal iPhone distribution needs
valid signing and a registered device. TestFlight needs App Store Connect setup
and processing; public release needs review. None of these device/build steps has
been verified by this preparation task.

### Update preparation and compatibility
The installed expo-updates package has a prepared **fingerprint** runtime policy.
It derives the runtime from native dependencies/configuration to avoid relying on
manual version bumps to prevent incompatible updates. It can conservatively
require extra builds; investigate fingerprint changes rather than overriding the
runtime to force delivery. Native dependencies, permissions/config plugins, SDK,
and native configuration changes require a new compatible native build.
JavaScript/UI/assets can use OTA only when the runtime and platform match and
App Store rules permit the change. Data migrations also need backward-compatible
rollout/rollback planning, even when native fingerprints match.

Updates are deliberately disabled (`updates.enabled=false`) and have no URL yet
for the current link-only task. Project verification has passed. In a separately
authorized update-configuration task, set
the exact existing project's `https://u.expo.dev/<project-ID>` URL and enable
updates as described in cloud-setup.md. No placeholder owner or identifier is
release configuration. Preview and production profiles have distinct channels
and explicit EAS environments, and their workflow actions pass both explicitly.

Prepared launch behavior uses checkAutomatically=ON_LOAD and
fallbackToCacheTimeout=0. The embedded or cached compatible bundle launches without
waiting for a download. A downloaded update normally applies on a later cold
launch; network/cache/error-recovery behavior affects timing. Do not promise
instant updates or require a laptop/Metro for standalone preview/TestFlight use.
No custom update prompt/reload UI was added. Channels must be mapped and verified
before first publication; no channel or remote update was created here.

Rollback is an explicitly authorized publication using pinned CLI
`update:rollback`, selecting the correct branch/runtime and either a known-good
update or the embedded bundle. Verify channel mapping and data compatibility
first, record the result, and smoke-test the device. See the cloud runbook for
the procedure and official references. No update or rollback was published.
