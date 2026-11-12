# Moo product

## Audience
People using an iPhone who want a simple daily record of protein intake and
creatine intake, with a friendly cow companion that makes progress easy to see.

## Core purpose
Help users consistently log intake and compare daily totals with goals they set
themselves. Moo records behavior; it does not prescribe diets or supplement doses.

## Initial scope
- Manual protein entries in grams, optionally labeled with a food or meal.
- Manual creatine entries in grams.
- User-set daily protein and creatine goals.
- Daily history with totals and entries, including edit and delete.
- Cow progress that reflects daily progress toward the user's goals.

The foundation only displays the home screen. Logging, goals, history, and cow
progress are planned features, not implemented features.

## Development constraint
Development and validation must work in cloud environments operated from a phone.
Use Expo cloud builds for installable iPhone binaries; everyday use of an installed
preview or production app must not require a laptop to stay on. See architecture.md
for the distinction between installed builds and interactive Metro development.

## Boundaries
Local, single-user experience first. No authentication, backend, payments, or AI.
Cloud build infrastructure does not mean user intake data is stored in the cloud.
The cow emoji on the foundation screen is a placeholder for a future mascot.

## Primary user, problem, and promise
The primary audience is an iPhone user who already chooses their own protein and
creatine goals and wants to log known amounts quickly. Full food diaries can add
friction when the user only needs these two totals. This is a problem hypothesis,
not evidence of demand. Moo's promise: a quick manual entry, a clear daily total,
and a friendly visual reminder of progress that is still there on reopening.

## First complete flow and smallest launch
Set a goal → log an amount in grams → see the updated total and cow progress →
close and reopen the app with the goal and record retained. The smallest complete
launch adds daily history and correction of mistakes through edit/delete, with
accessible forms and clear empty/error states. Keep protein and creatine separate;
users choose goals themselves. No recommended supplement doses or medical advice.

## Deferred and unvalidated
Defer food lookup/barcodes, meal plans, social features, streak systems, wearables,
notifications, account/cloud sync, payments, analytics, and AI. SQLite is a later
implementation step, not present storage. Backup/export and restore behavior must
be decided before launch so local-only data limitations are explicit.

Assumptions to validate: users know gram amounts; two manual trackers are enough;
the cow is helpful rather than distracting; local-only data is acceptable; history
is useful; the flow feels fast. Demand, retention, profitability, and willingness
to pay have not been proven.

## Short validation plan
Interview a small set of target users about their current logging routine and
missed-entry moments. Show a low-fidelity version of the four-step flow, ask them
to complete it unaided, and observe confusion, time, corrections, and expectations
about data retention. Revisit after several days of trial use; record qualitative
evidence and revise scope. Do not infer willingness to pay from positive comments.

Competitor research checklist: examine current iPhone protein-only, supplement,
and general nutrition trackers; record date/source, entry friction, goal controls,
history/edit support, offline retention, export, accessibility, price disclosure,
and review themes. Distinguish observed features from claims. No competitor usage,
revenue, ranking, or conversion statistics are assumed here.
