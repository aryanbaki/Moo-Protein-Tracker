# analyze-food

Photo → nutrition estimate for Moo's scanner. Verifies the caller's Supabase JWT, checks the free-scan allowance in `public.profiles`, sends the photo to the Anthropic Messages API and returns `{ items, source: 'photo' }`.

## Deploy

```sh
supabase functions deploy analyze-food
```

JWT verification stays on (the default). Do not pass `--no-verify-jwt`.

## Secrets

```sh
supabase secrets set ANTHROPIC_API_KEY=...        # required; lives only here, never in the app
supabase secrets set ANTHROPIC_MODEL=claude-sonnet-5-5   # optional; this is the default
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase.

## Needs

Table `public.profiles` keyed by `id = auth.uid()` with `is_premium boolean` and `photo_scans_used int` (see `supabase/migrations`). Free users get 3 photo scans; the count goes up only after a successful analysis.

## Responses

| Status | Body | Meaning |
| --- | --- | --- |
| 200 | `{ items, source: 'photo' }` | Estimates, already clamped and rounded |
| 401 | `{ error: 'unauthorized' }` | Missing/invalid token or anonymous user |
| 402 | `{ error: 'limit' }` | Free scans used up |
| 422 | `{ error: 'no_food' }` | No food in the photo |
| 400 / 413 | `{ error: 'bad_request' \| 'too_large' }` | Bad media type or body over ~4 MB of base64 |
| 5xx | `{ error: 'server' }` | Configuration or upstream failure |

## Notes

- The model is asked for one strict tool call (`report_food`). `tool_choice` is `auto` with parallel calls off, because current Claude models reject a forced tool choice; the system prompt requires the call.
- `_shared/sanitize.ts` is a byte-for-byte copy of `src/features/scan/sanitize.ts`; a Jest test fails if they drift. Edit the `src` file, then copy it over.
- The image, request body and keys are never logged.

## Try it

```sh
curl -X POST "$SUPABASE_URL/functions/v1/analyze-food" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"media_type\":\"image/jpeg\",\"image_base64\":\"$(base64 -w0 meal.jpg)\"}"
```
