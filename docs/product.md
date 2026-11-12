# Moo product

This document describes the v1 direction set by the owner. It replaces the earlier
foundation scope (local-only manual tracker with no accounts, backend, payments,
or AI). For what is actually built and checked, read [status.md](status.md) and
the implementation table in [architecture.md](architecture.md); this file states
intent, not evidence.

## Audience and promise
People with an iPhone who train, or want to eat better, and want to know whether
they are getting enough protein without keeping a full food diary.

Promise: **track your protein, fill the cow.** Moo is a protein tracker where a
cartoon dairy cow fills up as the day's protein goal is reached. Protein is the
hero number. Calories, carbs, and fat ride along. Creatine is an optional daily
check-off, not a second tracker.

## Onboarding
One question per screen, a progress bar on top, the cow reacting on each screen,
and one large pill button at the bottom. Answers are saved locally at every step
so quitting mid-flow resumes where it stopped.

1. Splash: the cow's head pops up with a "MOO!" speech bubble.
2. Welcome: "Track your protein. Fill the cow." Get started, or "I already have
   an account".
3. Main goal: build muscle / lose fat / maintain / just eat better.
4. Gym days per week: 0–1 / 2–3 / 4–5 / 6+.
5. Hardest part: eating enough protein / knowing what's in my food / remembering
   to log / staying consistent.
6. Are you getting enough protein today? yes / no / no idea.
7. Sex (used only for the calorie formula) and age (birth year).
8. Height and weight, with a metric/imperial toggle.
9. Target weight and pace (skipped for "maintain"). Pace is capped at about 1% of
   body weight per week; the cow sweats past the safe zone.
10. Chart: "Tracking beats guessing." A rising "With Moo" line against a wobbly
    "Winging it" line. This is an illustration and is labelled as one.
11. Creatine: "Do you take creatine?" yes / no / thinking about it.
    - No: "No creatine, no problem", continue.
    - Yes or thinking: a short informational explainer, pick a daily amount
      (default 5 g), pick a reminder time or "no reminder".
12. Notifications: a pre-prompt card, then the system prompt (meal nudges and the
    creatine reminder).
13. Loading: a comic UFO lifts the cow while setup steps tick off.
14. Your plan: daily protein goal (large), calories, carbs, fat; each editable.
15. Reality check, only when an edited goal is out of range: shows the
    recommended range and a "Use recommended" button.
16. Create account: Sign in with Apple, or an email one-time code.
17. Paywall (see Free and premium).
18. First log: Home, with a coach mark on the `+` button.

### Goal calculation
- Calories: Mifflin-St Jeor resting estimate × an activity factor from gym days,
  adjusted for the chosen pace.
- Protein per kg of body weight: maintain 1.4, eat better 1.4, build muscle 1.8,
  lose fat 2.0; rounded to 5 g.
- Fat is 25% of calories; carbs get the remainder.
- Every goal the user can edit goes through guard rails that return `ok`, `high`,
  or `blocked`.

## Main app
**Home.** A week strip of day dots, a streak indicator, and the cow centre stage.
Tapping the cow or logging anything switches it to a see-through outline that
fills to today's percentage, with the number shown in text ("86 g of 150 g").
A Day/Week switch re-fills the cow against the weekly goal. Three small tiles show
calories, carbs, and fat (eaten / goal). If creatine is enabled, a chip checks off
today's dose. Below: today's entries (name, protein, calories, time) with edit and
delete. A floating `+` opens: Scan food / Scan barcode / Search or type it /
Quick add grams. Reaching the goal triggers a short celebration.

**Scan.** Camera with a frame guide, shutter, library picker, and a barcode mode.
An analysing state, then a result sheet listing detected items with editable
portions, totals for protein, calories, carbs, and fat, a "rough estimate" note,
and Save. Failure states: no food found, offline, out of free scans. Photo
analysis runs on the server; barcodes are looked up in Open Food Facts; manual
entry always works.

**Progress.** Week / Month / Year protein against goal, goal-hit days, current and
best streak, averages, creatine consistency, and a weight log with a simple line.

**Settings.** Edit goals (re-runs the guard rails), body details, units,
reminders, creatine, account, subscription, export data, delete account, legal
links.

## Creatine
Optional. When enabled it is a once-a-day check-off with a user-chosen amount
(default 5 g) and an optional local reminder at a user-chosen time. It is not
logged gram by gram alongside protein, and users who answer "no" never see it.

## Free and premium
- Free: manual and barcode logging, the cow, goals, and 3 photo scans in total.
- Premium: unlimited photo scans, year history, and the weekly cow view.
- The paywall appears at the end of onboarding and can be closed (soft paywall).
  It reappears when a locked feature is tapped.
- Prices, trial length, and products come from the RevenueCat dashboard and App
  Store Connect. None are set yet, so none are stated here or hard-coded.
- Accounts use Supabase (Sign in with Apple or email code) and enable cloud sync.
  In-app account deletion is required.

## Honesty rules
These are requirements, not style preferences.
- **No invented statistics.** The comparison chart is labelled an illustration.
  No made-up percentages, user counts, ratings, testimonials, or "users gain 2×"
  claims anywhere, including the paywall. Real numbers may be added only when the
  owner has them and can source them.
- **Scans are estimates.** Photo and barcode results are always labelled as
  estimates and every value is editable before and after saving.
- **Not medical advice.** Goals and creatine copy are informational and carry a
  "not medical advice" line. Creatine copy may say that 3–5 g a day is the
  commonly studied dose; it must not diagnose, promise results, or tell an
  individual what they should take.
- **Guard rails on unrealistic goals.** Protein above 3 g per kg of body weight
  (or 350 g) is blocked; calories below a safe floor are blocked; weight-change
  pace is capped at about 1% of body weight per week. Blocked values show the
  recommended range instead of being silently accepted or silently changed.
- **No shaming.** Missing a goal or going over it shows the true total without
  judgement or streak pressure beyond the streak count itself.
- Sex is asked only because the calorie formula needs it, and the screen says so.

## Deferred
Not part of v1:
- Social features, friends, leaderboards, sharing feeds.
- Wearables and Apple Health integration.
- Android and web as products. Web is used only to check the app in cloud
  sessions; Android is not prepared for delivery.
- Meal plans, recipes, and coaching.
- iPad layouts.

## Development constraint
Development and validation run in cloud environments operated from a phone.
Installable iPhone builds come from Expo EAS; using an installed preview or
production build must not need a laptop to stay on. See
[architecture.md](architecture.md) and [cloud-setup.md](cloud-setup.md).

## Assumptions not yet validated
The new scope is the owner's direction, not a tested finding. Demand, retention,
profitability, and willingness to pay have **not** been proven. Open assumptions:
- People want protein-first tracking rather than a full calorie app.
- The cow makes progress easier to understand and is not a distraction.
- A long onboarding with a paywall at the end is finished by enough people.
- Photo estimates are accurate enough to be trusted and worth paying for; the
  per-scan server cost fits the price.
- 3 free scans is the right allowance.
- Users accept creating an account, and accept food photos being sent to a
  server for analysis.
- A daily creatine check-off is more useful than gram logging.

How to check, cheaply: interview a small set of target users about how they track
today; watch them complete onboarding and a first log unaided, noting where they
hesitate or drop; compare scan estimates with known foods; revisit after several
days of use. Do not infer willingness to pay from positive comments.

Competitor notes: [design.md](design.md) lists the reference apps used for
interaction patterns. No competitor usage, revenue, ranking, or conversion figure
is assumed anywhere in these docs; record date and source for any that are added.
