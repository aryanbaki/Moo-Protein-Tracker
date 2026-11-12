# Claude handoff: foundation review

Connect Claude Code's cloud workspace to aryanbaki/Moo-Protein-Tracker. Use
GitHub as the shared source of truth; Codex and Claude do not share local files,
conversations, or secret stores. Assign one builder per branch. No Expo token is
needed for an ordinary code review; configure a separate secure secret only when
an authenticated Expo task requires it.

Paste this prompt after Codex has pushed the linking task:

> Review aryanbaki/Moo-Protein-Tracker PR #1 on codex/moo-foundation. Fetch the
> latest branch, record its SHA, and read AGENTS.md, CLAUDE.md, docs/status.md and
> the documents they reference. Review the pushed foundation and existing Expo
> project link. Confirm that app.json uses owner aryanbakis-team, slug
> moo-protein-tracker, and project ID e3e7b8db-430f-4dc3-a5b5-deff3b0a45e1.
> Updates intentionally remain disabled for the link-only task. Verify release
> gates remain closed and distinguish past CI results from fresh validation.
> Report actionable findings and recommend one next task. Do not edit the builder's
> branch, create a new Expo project, merge, build, submit, publish updates, or
> change signing credentials. Do not assume you inherit Codex credentials.

## Recommended sequence
1. Review foundation/linking, then resolve existing iOS identity and Apple/GitHub
   prerequisites. Register the iPhone when available. A separately authorized
   initial internal preview build/install and smoke test establishes device readiness.
2. While the phone is unavailable, agree on a static cow concept and a low-fidelity
   home screen showing goals, totals, and logging. Avoid elaborate animation now.
3. Implement one complete flow: user-set goal → manual entry → updated total/cow
   state → retained state after reopening. Add meaningful storage/date/input tests.
   Keep onboarding limited to the goal setup this flow needs.
4. Once a compatible preview is installed and tested, enable the documented update
   configuration/channel and readiness gates with evidence. Compatible JavaScript,
   UI, and asset changes can be delivered through a manual preview-update action.
   Native dependencies/configuration/SDK changes need another native build.

Pushes currently run checks, not delivery. Automated updates on every edit are
not configured. A standalone preview needs no continuously running computer;
Metro Fast Refresh requires a reachable, active cloud development server. Current
planned OTA launch settings apply downloaded updates on a later cold launch,
so neither workflow guarantees instant delivery. Internal iPhone installation
requires Apple signing and device registration; TestFlight is an alternative.
