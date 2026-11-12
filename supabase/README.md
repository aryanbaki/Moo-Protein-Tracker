# Moo backend setup (owner checklist)

Moo runs fully **local-only** until the steps below are done: no accounts, no
sync, sample plans on the paywall, mock photo scans. Nothing here has been
created yet. Each step lights up one part of the app.

What lives in this folder:

| Path | What it is |
| --- | --- |
| `migrations/0001_init.sql` | Tables, row-level security, triggers |
| `functions/delete-account` | Deletes the caller's data and login (required by the App Store) |
| `functions/analyze-food` | Photo → nutrition estimate through Claude (see its own README) |

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick the organisation, name it `moo`, choose a region near your users, and save the database password somewhere safe.
2. Install the CLI and link this repo to the project:

   ```sh
   npm install -g supabase
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

   The project ref is the short id in the dashboard URL.

## 2. Run the migration

```sh
supabase db push
```

(Or paste `migrations/0001_init.sql` into **SQL Editor** and run it once.)

Afterwards, in **Table Editor**, you should see `profiles`, `food_entries`,
`creatine_logs` and `weight_logs`, each showing "RLS enabled".

What the migration guarantees:

- Every row is visible and writable only by its owner.
- A `profiles` row is created automatically for each new user.
- Users cannot change `is_premium` or `photo_scans_used` themselves (column grants plus a trigger). Only the service role can: the RevenueCat webhook and `analyze-food`.
- Rows are never hard-deleted by the app. A delete is a row with `deleted_at` set, so it reaches the user's other devices.
- An older write never overwrites a newer one (`updated_at` is compared on the server too).

## 3. Turn on sign-in

**Email one-time code** (Authentication → Sign In / Providers → Email)

1. Enable the Email provider. "Confirm email" can stay on.
2. Authentication → Emails → **Magic Link** template: the app asks for a 6-digit code, so the email must show the code, not only a link. Put `{{ .Token }}` in the body, for example: `Your Moo code is {{ .Token }}`.
3. Check the email OTP length is **6** (Authentication → Sign In / Providers → Email → OTP length).
4. The built-in email sender is limited to a few emails per hour and is for testing only. Before launch, add your own SMTP provider under Authentication → Emails → SMTP Settings.

**Sign in with Apple** (needs the Apple Developer account and the final bundle identifier)

1. In the Apple Developer portal, enable the **Sign in with Apple** capability for the app's bundle identifier.
2. Supabase → Authentication → Sign In / Providers → **Apple**: enable it and add the bundle identifier under **Client IDs**. The app uses the native sign-in sheet, so no service ID, secret key or redirect URL is needed.
3. `app.json` already has `ios.usesAppleSignIn: true` and the `expo-apple-authentication` plugin. Set `ios.bundleIdentifier` to the same identifier, then make a new EAS build.

Not done yet, to decide before launch: Apple asks apps to revoke the user's
Sign in with Apple token when the account is deleted. `delete-account` removes
all data and the login but does not call Apple's revoke endpoint, because that
needs an Apple service key that does not exist yet.

## 4. Secrets and edge functions

```sh
supabase secrets set ANTHROPIC_API_KEY=<your Anthropic key>
supabase functions deploy delete-account
supabase functions deploy analyze-food
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided
to functions automatically. The Anthropic key lives only in Supabase secrets; it
is never in the app.

Both functions verify the caller's sign-in token themselves.

## 5. Point the app at the project

From Project Settings → API copy the **Project URL** and the **anon / publishable key**
(both are safe to ship in an app; row-level security is what protects the data).

Local development: copy `.env.example` to `.env` and fill in

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

EAS builds:

```sh
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<project-ref>.supabase.co --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key> --visibility plaintext
```

Repeat for `preview` and `development` if you use those profiles. `EXPO_PUBLIC_`
values are baked in at build time, so a new build is needed after changing them.

Never put the **service role** key in the app or in an `EXPO_PUBLIC_` variable.

## 6. RevenueCat (paywall)

1. App Store Connect: create the subscription group and products (a yearly one, with the free trial as an introductory offer if you want one, and a monthly one). Prices and trial length are set here and nowhere else; the app only displays what the store returns.
2. RevenueCat: create a project, add the iOS app (bundle identifier + App Store Connect key), and import the products.
3. Create an **entitlement** with the identifier exactly `premium` and attach both products.
4. Create an **offering**, mark it **current**, and add the yearly product as the *Annual* package and the monthly product as the *Monthly* package.
5. Copy the **public iOS SDK key** (starts with `appl_`) and set it for builds:

   ```sh
   eas env:create --environment production --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxx --visibility plaintext
   ```

Until that key exists the paywall shows sample plans with no prices. In
development and web builds its button says "Preview build: no charge" and just
unlocks premium locally; in a production build without the key the button is
disabled.

**Webhook for `is_premium` (not built yet).** The app itself reads premium
status straight from RevenueCat. The server needs it too, so `analyze-food` can
allow unlimited scans: `profiles.is_premium` must follow the subscription. The
app logs in to RevenueCat with the Supabase user id, so webhook events carry it
as `app_user_id`. To finish this:

1. Write a small edge function (for example `revenuecat-webhook`) that checks a shared secret in the `Authorization` header, then sets `profiles.is_premium` with the service role: `true` for `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `PRODUCT_CHANGE`; `false` for `EXPIRATION`.
2. `supabase secrets set REVENUECAT_WEBHOOK_SECRET=<random string>` and deploy it with `--no-verify-jwt`.
3. RevenueCat → Integrations → Webhooks: add the function URL and the same secret as the Authorization header value.

Until then every signed-in user is treated as free by the server (3 photo scans), even after paying.

## 7. Legal links

`src/features/billing/links.ts` holds placeholder Terms and Privacy URLs
(`example.com`). Replace them with the real pages before submitting: Apple
rejects subscription screens without working links.

## Check it works

1. Sign in with an email code in the app; a row appears in `profiles`.
2. Log a food; within a few seconds it appears in `food_entries`.
3. Install on a second device (or clear the app), choose "I already have an account", sign in: goals and logs come back.
4. Settings → Delete account: the user disappears from Authentication → Users and all their rows are gone.
