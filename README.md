# Moo

Your daily protein buddy. An iPhone app for tracking protein and creatine with a cow companion.

## Development

Use a cloud coding environment from your phone; no laptop needs to stay running.
Use Node.js 24 LTS and npm.

```sh
npm ci
npm run typecheck
npm run lint
npm run doctor
```

`npm start` runs Metro for interactive development and requires that development
environment to remain available. Installed preview/production builds bundle the app
and do not require Metro or a running laptop.

## Next: cloud iPhone builds

Expo EAS Build will build the native app in the cloud. Account linking and Apple
signing are intentionally deferred. In the next setup session, authenticate with
your real Expo account, link the actual EAS project, choose your owned iOS bundle
identifier, and configure Apple credentials. Do not invent identifiers.
Then configure EAS build profiles and create an internal-distribution preview build
(or TestFlight build). Physical-device internal distribution requires Apple signing
and registered devices; TestFlight requires App Store Connect setup.

No authentication, backend, payments, or AI features are included.

- [Product](docs/product.md)
- [Architecture](docs/architecture.md)
- [Tasks and verification](docs/tasks.md)
- [Shared agent instructions](AGENTS.md)
