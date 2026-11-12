# Moo

Track your protein. Fill the cow.

Moo is an iPhone app for daily protein tracking. A cartoon dairy cow fills up as
you reach your protein goal; calories, carbs, and fat ride along, and creatine is
an optional daily check-off with a reminder. Food can be logged by photo scan
(an estimate, analysed on a server), barcode, or by hand. Accounts, cloud sync,
and a premium tier are part of the v1 direction.

Built with Expo SDK 58, React Native, Expo Router, and strict TypeScript. What is
built and checked so far is recorded in [current status](docs/status.md); the
[architecture](docs/architecture.md) lists what still needs accounts and keys.
Read [AGENTS.md](AGENTS.md) and the status file before changing anything.

## Run

```sh
# Node 24 LTS (.nvmrc), from the repository checkout
npm ci
npm start        # Metro dev server
npm run web      # run in a browser (react-native-web)
npm test         # Jest unit tests
```

Checks used before a pull request:

```sh
npm run test:setup
npm run typecheck
npm run lint
npm run doctor
npm run export:ios
```

`npm run export:ios` and the web build verify JavaScript bundling, not native
compilation or device behaviour. The app uses native modules (camera,
notifications, SQLite, secure storage, Sign in with Apple, purchases), so it
needs a development or preview build made by EAS, and a new native build is
needed before these features reach a phone.

## Environment

Copy `.env.example` to `.env` and fill in the public client values (Supabase URL
and anon key, RevenueCat iOS key). Leave them blank to run local-only with mock
scanning. `.env` is ignored by Git. Server secrets such as the Anthropic API key
are stored in Supabase and never belong in this repository or the app bundle.
Details: [architecture, environment variables](docs/architecture.md#environment-variables).

## Delivery

EAS profiles and a guarded manual GitHub delivery workflow are prepared. Apple
identity, signing, a native build, installation, and device testing remain
pending; consult status for actual results. Only the existing Expo project
`e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1` may be used. Pushing a branch cannot
trigger builds, submissions, or OTA publications.

## Docs

- [Product direction and honesty rules](docs/product.md)
- [Design rules and mascot](docs/design.md)
- [Architecture, backend, and update policy](docs/architecture.md)
- [Cloud setup, credentials, Apple steps, and delivery](docs/cloud-setup.md)
- [Current status](docs/status.md)
- [History, milestones, and owner inputs](docs/tasks.md)
- [Claude Code entry point](CLAUDE.md)
