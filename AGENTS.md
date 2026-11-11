# Shared project instructions

Read this file before changing Moo. Claude Code must follow these same instructions.

## Product and scope
- Moo is an iPhone app for daily protein and creatine tracking with a cow mascot.
- Read docs/product.md, docs/architecture.md, and docs/tasks.md for current scope.
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
- Expo account linking and Apple signing are a separate setup step.
- Never invent account IDs, EAS project IDs, bundle identifiers, or credentials.
- Never commit secrets, signing materials, tokens, or .env files.

## Validation and handoff
- Run npm ci on a fresh checkout.
- Run npm run typecheck, npm run lint, and npm run doctor before opening a PR.
- Fix failures where possible and report exact unresolved limitations honestly.
- Keep docs/tasks.md current with completed work, verification, and next steps.
- Add meaningful tests when introducing logging, goal, date, or storage logic.
