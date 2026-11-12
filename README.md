# Moo

Your daily protein buddy: an iPhone app for manual protein and creatine tracking
with user-set goals and a friendly cow. The current app is a home-screen scaffold;
logging, persistence, history, and progress are future features.

Use a cloud workspace from a phone; no laptop needs to stay on. Read
[AGENTS.md](AGENTS.md) and [current status](docs/status.md) first.

```sh
# Node 24 LTS, from the repository checkout
npm ci
npm run test:setup
npm run typecheck
npm run lint
npm run doctor
npm run export:ios
```

The iOS export verifies JavaScript bundling, not native compilation or device
behavior. `npm start` runs Metro and needs an active cloud development environment.
Standalone preview/TestFlight builds bundle JavaScript and can run independently.

EAS profiles and a guarded manual GitHub delivery workflow are prepared. Expo
account verification, linking, confirmed Apple identity, signing, native build,
installation, and device testing remain pending; consult status for actual results.
Only the existing Expo project `e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1` may be used.
Pushing this branch cannot trigger builds, submissions, or OTA publications.

- [Cloud setup, credentials, Apple steps, and delivery](docs/cloud-setup.md)
- [Product and validation plan](docs/product.md)
- [Architecture and update policy](docs/architecture.md)
- [Design rules](docs/design.md)
- [Current status](docs/status.md)
- [History and backlog](docs/tasks.md)
- [Claude Code entry point](CLAUDE.md)
