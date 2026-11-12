# Shared project instructions

Read this file before changing Moo. Claude Code must follow these same instructions.

## Start every task
- Confirm the repository is aryanbaki/Moo-Protein-Tracker and inspect git status
  before switching branches or editing. Until foundation setup is merged, continue
  codex/moo-foundation. After merge, branch each task from current main unless
  the task specifies an existing branch. Fetch first; never reset to a historical SHA.
- Preserve staged, unstaged, and untracked work. Never reset, clean, overwrite,
  or force-push to simplify setup.
- Read docs/product.md, docs/architecture.md, docs/design.md, docs/cloud-setup.md,
  docs/status.md, and docs/tasks.md,
  plus any instructions in the directories being changed, before implementation.
- docs/status.md is the current handoff; docs/tasks.md retains foundation history
  and the longer backlog. Check claims against source/configuration and actual
  command output rather than treating earlier notes as fresh validation.

## Product and scope
- Moo is an iPhone app for daily protein and creatine tracking with a cow mascot.
- Build small, reviewable changes and preserve existing work.
- Do not add authentication, a backend, payments, or AI features.
- Do not infer supplement goals or provide medical dosing advice; goals are user-set.

## Stack and structure
- Use the stable Expo SDK selected for this foundation, React Native, TypeScript
  with strict checking, and Expo Router.
- Route files belong in src/app. Shared design values belong in src/theme.
- Use npm only. Commit package-lock.json whenever dependencies change.
- Use npx expo install for native dependencies to keep SDK versions compatible.
- Keep generated ios/ and android/ directories out of Git; use EAS cloud builds.
- Consult https://docs.expo.dev/versions/latest/ for current Expo APIs; check
  compatibility with the installed SDK before adopting newer APIs.
- Read architecture documentation before implementing local persistence.
- Use accessible text, safe areas, and reusable theme values.

## Cloud and credentials
- Development is managed from a phone using Codex and Claude Code.
- Builds run through Expo EAS; a laptop must not be required to stay running.
- Reuse the existing Expo project e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1.
  Do not create a replacement project or run an automatic project-creation flow.
  Verify authenticated owner/slug metadata before linking app.json. Account
  username and dashboard display name are not proof of project ownership.
- Use GitHub Actions as the single delivery orchestrator. Keep all delivery
  manual, guarded, and separate from read-only checks. Never open readiness gates
  without the evidence listed in docs/cloud-setup.md. Updates remain disabled
  until the exact existing project is verified and configured.
- Do not start EAS builds or submissions unless the current task authorizes them.
- Never invent account IDs, EAS project IDs, bundle identifiers, or credentials.
- Never commit secrets, signing materials, tokens, or .env files. Use each cloud
  provider's secure secret store; Codex, Claude, GitHub, and Expo stores are separate.
- Use one builder per branch. The other agent reviews a specific pushed commit/PR.
  Claude must separately connect to this repository and check out the named branch;
  do not assume shared conversations, tools, workspaces, or uncommitted edits.
- Define one concrete task and completion criteria before changing files.

## Validation and handoff
- Use Node.js 24 LTS (.nvmrc) and npm; check node --version and npm --version.
- Run npm ci on a fresh checkout. Do not regenerate the lockfile just to hide
  an installation failure.
- Run npm run test:setup, npm run typecheck, npm run lint, npm run doctor,
  and npm run export:ios for setup/app changes before opening or updating a PR.
- For app changes, also run npx expo export --platform ios to check JavaScript
  bundling. This is not a native build and does not prove iPhone behavior.
- EAS CLI is pinned to 27.7.2; use npx --yes eas-cli@27.7.2. Do not add it
  as a project dependency (Expo Doctor rejects that installation).
- npm start runs Metro; npm run ios needs an iOS simulator environment and is
  not the cloud iPhone build path. test:setup exercises release guard behavior;
  there is no product logic test suite yet.
- For documentation-only work, verify links, facts, and git diff --check; record
  any additional checks actually run.
- Fix failures where possible and report exact unresolved limitations honestly.
  Record passed, failed, blocked, and not-run checks separately.
- Before finishing every task, update docs/status.md with completed work,
  commands and observed results, blockers, and one concrete next task. Keep
  docs/tasks.md consistent when backlog items change, without duplicating status.
- Review the diff, commit only intended files, and push completed work. Update
  the task PR when applicable without merging it. Report commit/push outcomes;
  never report a check or remote operation as successful without evidence.
- Add meaningful tests when introducing logging, goal, date, or storage logic.
