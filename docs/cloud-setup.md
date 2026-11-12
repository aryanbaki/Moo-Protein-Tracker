# Cloud setup and delivery runbook

Moo lives in aryanbaki/Moo-Protein-Tracker. Use Codex Cloud or a separately
configured Claude Code cloud workspace; no laptop needs to stay on. GitHub is
the shared source of truth, not agent conversation memory. See [status](status.md)
for what has actually been verified.

## Start a session (repeat)
1. Select the Moo-Protein-Tracker repository and its published cloud environment.
   Confirm shell execution, locate the checkout (`pwd`, then `git rev-parse
   --show-toplevel` inside it), and inspect `git remote -v` and `git status`.
2. Read AGENTS.md and the documents it names. Preserve all existing work. Fetch
   origin and continue codex/moo-foundation until setup is merged. After merge,
   start each task on its own branch from current main. Never reset to an old
   handoff commit. If the branch advanced, integrate it without losing edits.
3. Use Node 24 LTS (`.nvmrc`; validated with 24.22.1) and npm. Run `npm ci` from
   the repository root. A cloud session does not inherit another session's tools,
   dependencies, credentials, working tree, or unpushed work.
4. Run `npm run test:setup`, `npm run typecheck`, `npm run lint`,
   `npm run doctor`, and `npm run export:ios`. The export checks JavaScript
   bundling, not native compilation or iPhone behavior.
5. Update status.md, inspect the diff, commit and push the task, and hand off a
   commit SHA or PR. Do not commit generated ios/, android/, .expo/, or dist/.

## Network access (environment owner, one-time and on failure)
Keep package-manager domains enabled. Configure additional HTTPS destinations:

| Destination | Purpose |
| --- | --- |
| exp.host | Expo app configuration schema |
| api.expo.dev | Authenticated project metadata, EAS API and SDK metadata |
| reactnative.directory | Expo Doctor package compatibility metadata |
| docs.expo.dev | Official SDK/tooling guidance |
| u.expo.dev | Update manifests for the existing project |
| github.com, api.github.com | Git operations and GitHub API/CLI respectively |
| registry.npmjs.org | Locked dependency installation and npm audit |

Future uploads/downloads may require additional Expo artifact/storage hosts.
Allow only the destination reported by the actual request; never send EXPO_TOKEN
to arbitrary artifact hosts. A secret's allowed domain does not itself allow
network access. Preserve proxy settings and CA trust; do not disable TLS.

The observed desktop path is Settings → Codex Cloud → Environments →
Moo-Protein-Tracker → three-dot menu → Edit. This opens an environment setup chat
with an Environment panel. Use the pencil beside Additional allowed domains.
Save the draft and publish the configuration. Published changes may apply only
to new sessions: inspect the running environment's observed revision, allowed
hosts, and secret readiness. A saved configuration is not proof of live access.

## Expo credentials: three separate stores
Known account username: `aryanbaki`. User-reported dashboard display name:
`Moo: Protein Tracker`. Neither proves project ownership or slug.

1. **Codex cloud HTTP secret:** create a token at
   https://expo.dev/accounts/aryanbaki/settings/access-tokens (Account settings →
   Access tokens). In the environment editor choose HTTP secrets → Manage.
   Set Key `EXPO_TOKEN`, paste the value in Value, keep Environment selected,
   and restrict the secret's domain to `api.expo.dev`. Save and publish.
   The cloud proxy may expose a placeholder and inject the real token only on
   allowed HTTPS requests. Use the inherited proxy; never print either value.
   Do not paste domains into the “Paste your .env or type a key” field.
2. **GitHub Actions secret:** separately create an `EXPO_TOKEN` secret in each
   GitHub environment (`preview`, `production`) under repository Settings →
   Environments. Scope access to the intended Expo project/account; use separate
   revocable tokens when practical. Codex secrets do not populate GitHub.
3. **Expo environment variables:** EAS development/preview/production environments
   hold app/build configuration. They are not the place to put a token used to
   authenticate Codex or GitHub to Expo. This app currently needs no app secrets.
   Never put secrets in EXPO_PUBLIC_* values; those are bundled into the app.

Claude Code must receive credentials separately via its cloud provider's secure
secret mechanism. Never paste tokens, Apple passwords, or 2FA codes into chats,
commands that enter shell history, source files, or logs.

## Verify and link the existing project (agent, once access works)
Existing project ID: `e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1`.

Run `npm run expo:project`. This read-only GraphQL lookup authenticates with
EXPO_TOKEN and queries that exact ID; it prints only project identity metadata.
Confirm the returned ID, ownerAccount.name, and slug, including possible team
ownership. Inspect existing iOS credentials/build metadata for a bundle ID before
proposing a new one. Do not infer owner from the username or slug from the title.

Merge verified `owner`, `slug`, and `extra.eas.projectId` into app.json, preserving
unrelated fields. Never run a flow that creates a new project. Once verified,
activate the prepared update configuration by setting `updates.enabled: true`
and `updates.url: https://u.expo.dev/e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1`.
Keep the fingerprint runtime policy. Run `npm run expo:project -- --verify`,
`npx expo config --type public`, Doctor, and export; review and commit the changes.
This is configuration only: do not run `eas update` or `eas build` during linking.

EAS CLI is pinned to **27.7.2** in eas.json and workflow commands. Use
`npx --yes eas-cli@27.7.2 <command>`; it is intentionally not an app dependency
because Expo Doctor rejects project-local EAS CLI. Expo CLI comes from the lockfile.

## Apple identity and signing (owner decisions, then secure cloud setup)
These identifiers are different:

| Identifier | Meaning / current authority |
| --- | --- |
| Expo project ID | Existing UUID above, supplied by user; access still needs verification |
| Expo owner / slug | Must come from authenticated Expo project metadata |
| iOS bundle identifier | Permanent app identity; inspect Expo credentials and Apple Identifiers first |
| Apple Team ID | Developer team identifier; choose the correct existing team |
| App Store Connect app ID | Numeric ID of the selected App Store Connect app; not the bundle ID |

No Apple values are verified yet. If no existing bundle ID is found, proposed
candidate **com.aryanbaki.moo** needs the owner's confirmation and availability
check before it is committed as `ios.bundleIdentifier`. It is not configured now.

One-time sequence, without needing a local Mac:
1. In developer.apple.com/account, confirm active Developer Program membership,
   the correct team, and any existing app identifier. Do not purchase membership
   or create a duplicate identifier as part of an automated setup task.
2. Confirm the bundle ID, then record it in app.json. Verify whether existing
   certificates/provisioning profiles can be reused. In an explicitly authorized
   signing session, use `npx --yes eas-cli@27.7.2 credentials --platform ios` in
   a secure interactive cloud terminal with Expo-managed credentials. The owner
   completes Apple login/2FA privately if required. Do not revoke existing assets.
3. For internal previews, register the iPhone with
   `npx --yes eas-cli@27.7.2 device:create` in that authorized session and open the
   provided registration link on the iPhone. Ensure the ad-hoc profile includes
   the device; workflow builds freeze credentials and cannot repair this for you.
4. In appstoreconnect.apple.com, select the correct existing app or, only after
   checking for duplicates, create the app record using the confirmed bundle ID.
   Record its numeric Apple ID in `submit.production.ios.ascAppId` in eas.json.
5. Configure a suitable App Store Connect API key through Users and Access →
   Integrations → App Store Connect API, with the permissions needed for upload
   (normally App Manager). Confirm team policy and available key types first.
   Use EAS credentials' submission-key setup to store it securely with Expo.
   The prepared workflow expects Expo-managed submission credentials, not a
   private .p8 file in GitHub. No Apple password is required in the workflow.

Signing, device registration, and submission-key setup are pending until verified.
No signing operation, native build, or submission was executed by this preparation.

## Manual delivery (future explicit tasks only)
GitHub Actions is the single delivery orchestrator: the code, review, checks, and
manual release entry point remain together. EAS performs the native compilation,
signing, and submission. There is no competing Expo Workflow or push-triggered
release integration configured in this repository.

`checks.yml` runs on PRs and main pushes. `delivery.yml` has **only
workflow_dispatch**. It offers five explicit actions: preview-build,
production-build, testflight, preview-update, and production-update. A typed
confirmation must match the selected action. Production actions require main.
TestFlight requires an explicit finished production build UUID, never “latest”.
Every action reruns checks and verifies authenticated project identity first.
No delivery workflow has been executed; local validation is not a cloud run.

Before enabling delivery, the owner must create GitHub environments `preview`
and `production`, restrict production to main, and configure required reviewers
where the repository plan supports them. Store EXPO_TOKEN as described above.
Readiness variables default to closed when missing. Set them in the corresponding
GitHub environment only after the stated evidence exists:

| Variable = true | Required evidence |
| --- | --- |
| MOO_EXPO_VERIFIED | Actual project ID/owner/slug match, update URL activated, bundle ID confirmed |
| MOO_APPLE_SIGNING_READY | Valid signing credentials and, for preview, registered device/profile |
| MOO_UPDATES_READY | Compatible native binary installed and smoke-tested for this channel/runtime |
| MOO_SUBMIT_READY | Correct ascAppId and usable Expo-managed submission API key |

These flags are readiness records, not replacements for GitHub access controls.
Do not open a gate just to make a command pass. Direct CLI use still needs the
same review and task authorization. Updates also require checking that the target
channel points to the intended branch and a compatible tested native runtime.

After a separate review/merge (not this task), GitHub mobile/web → repository →
Actions → Manual iOS delivery → Run workflow. Select the reviewed ref, select one
action, type that action as confirmation, and supply the update message or build
UUID as appropriate. GitHub only exposes manual workflows on the default branch;
therefore the unmerged foundation is intentionally not a runnable release path.

Preview builds: open the successful EAS build's install link on the registered
iPhone. Production builds alone do not upload to Apple: run the separate
`testflight` action later with that exact build ID. After Apple's processing and
any testing requirements, install through TestFlight. Public App Store release
needs a separate submission for review and approval; this workflow does not do it.
EAS jobs continue in the cloud after GitHub dispatch; no laptop stays on.

Development profile: a future authorized command is
`npx --yes eas-cli@27.7.2 build --platform ios --profile development`.
It creates a development client and may need an active cloud Metro server
(`npm start`). A preview/TestFlight binary bundles JavaScript and needs neither
Metro nor a laptop at runtime.

## Updates and rollback
See [architecture](architecture.md) for runtime compatibility and launch behavior.
Preview and production updates are separate explicit workflow actions with the
matching channel and EAS environment. Never use `--auto` or omit the channel.
Native/permission/SDK changes require a new native build, not only an update.

For an explicitly authorized rollback, use pinned CLI
`npx --yes eas-cli@27.7.2 update:rollback` in a secure cloud terminal. Inspect the
channel-to-branch mapping and affected runtime first; select the intended branch
and either a known-good compatible update or the embedded build update. Confirm
before the command publishes the rollback. Record the group/runtime/commit and
verify on a device. `update:republish` and `update:roll-back-to-embedded` are the
supported underlying operations; inspect their pinned CLI help before automation.
Rollback is a publication, not an offline undo, and is not instantaneous. Do not
roll back across incompatible database migrations; design reversible migrations
and backup/restore before implementing storage.

## Troubleshooting
- Shell never starts: environment provisioning failure; fix the environment,
  not the app. Keep the exact error and environment revision.
- “Not a git repository”: locate the checkout; /workspace itself is not the repo.
- Expo token absent after publish: saved and running environments may differ.
  Finish/push work, then select the newly published environment in a fresh cloud
  session. Never discard an active dirty working tree to refresh credentials.
- 401/unauthorized: verify token validity and access to the actual owning team.
  403 CONNECT: inspect the running network allowlist and secret destination scope.
  EAI_AGAIN: check proxy support in the client, not only DNS. Node 24's
  `--use-env-proxy` is used by the metadata script; some Expo tools have different
  proxy support. Keep TLS verification enabled.
- Doctor network failure: capture exact error and hostname, change the actual
  cause before retrying, and keep independent checks moving. Do not change SDKs
  or suppress checks to hide a network problem.

## Agent handoff prompts
Builder: “Read AGENTS.md and docs/status.md in aryanbaki/Moo-Protein-Tracker.
Fetch current branches and preserve all existing work. Complete [one task] on
[branch]. Run relevant checks, update status, commit and push. Report actual
results and blockers. No builds, submissions, or updates unless explicitly asked.”

Reviewer: “Read AGENTS.md and project docs. Review pushed commit [SHA] / PR [URL]
against [base]. Check behavior, tests, release guards, and documented claims.
Report actionable issues with file/line references. Do not edit the builder's
branch or publish anything.”

Use one builder per feature branch. Claude must independently connect to the
same GitHub repository and check out the specified branch. The other agent reviews
a pushed commit or PR; do not assume shared memory or simultaneous safe editing.

## Official references
- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/eas/json/
- https://docs.expo.dev/build/internal-distribution/
- https://docs.expo.dev/submit/ios/
- https://docs.expo.dev/eas-update/runtime-versions/
- https://docs.expo.dev/eas-update/rollbacks/
