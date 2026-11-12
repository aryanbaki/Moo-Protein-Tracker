# Food data sources

Research and design notes for where Moo gets protein (and calorie, carb, fat)
numbers. Code: `src/features/foods/`. Edge Function: `supabase/functions/food-search/`.

Researched November 12, 2026. Live calls to the APIs were blocked by this
cloud sandbox's network policy, so the mappers are tested against fixtures
built from each API's documented response shape. The first real-device or
unrestricted-network run should check one barcode and one search per source.

## How MyFitnessPal does it (and why we can't copy it)

MyFitnessPal's food database is mostly **crowdsourced**: users type in label
data, plus licensed and partner brand data, plus generic USDA-style entries.
That is why it has many duplicate and wrong entries. Its developer API was
closed to the public years ago (around 2017–2019 depending on the source) and
is partner-only now; no public key can be requested. Scraping it would break
its terms. So we build the same thing from **free, openly licensed** sources.

## Sources we use

| Source | What it covers | Cost / key | Limits | Licence | Used for |
| --- | --- | --- | --- | --- | --- |
| **Open Food Facts** | ~3M+ packaged foods worldwide, community-entered labels, barcodes | Free, no key; custom User-Agent required | 100 product reads/min, 10 searches/min per IP | ODbL (attribution, share-alike for the database) | Barcode lookup (first), text search (secondary) |
| **USDA FoodData Central** — Branded | US manufacturer label data with UPC/GTIN, serving size and household serving ("1 scoop") | Free api.data.gov key | 1,000 requests/hour per IP (DEMO_KEY far lower) | Public domain (CC0 1.0) | Barcode fallback, text search (primary) |
| **USDA FoodData Central** — Foundation, SR Legacy, Survey (FNDDS) | Lab-analysed generic foods: chicken breast, eggs, lentils, tuna… | same key | same | CC0 | Text search, matching photo guesses for whole foods |

Why both: Open Food Facts is best for scanning (worldwide, no key, fast GET),
USDA is best for typed searches and for reliability (labels submitted by the
manufacturer, lab data for whole foods). Protein products (whey, bars, shakes,
Greek yogurt) are well covered by both.

## Sources evaluated and not wired in

| Source | Why not (now) |
| --- | --- |
| MyFitnessPal | No public API; partner-only. |
| FatSecret Platform | Free "Basic" tier exists but barcode lookup is Premier-only. "Premier Free" for startups/students needs an application and attribution. Good candidate later: apply, then add a provider. |
| Nutritionix | Strong natural-language parsing ("2 eggs and toast"); free tier status unclear and keyed. Revisit if natural-language logging is wanted. |
| Edamam, Spoonacular, CalorieNinjas, API Ninjas | Free tiers are small, keyed, and some require attribution or limit commercial use. No coverage we lack. |

Adding one later = one file in `src/features/foods/` that maps its response to
`FoodItem`, plus a branch in `service.ts`. Any paid or secret key goes through
an Edge Function like `food-search`, never an `EXPO_PUBLIC_` variable.

## How the app uses them

```
Barcode scanned ──► Open Food Facts product ──found──► result sheet
                         │ not found / no numbers / error
                         ▼
                    USDA Branded search by the code, keep only an exact GTIN match
                    (leading zeros ignored: UPC-A 12 = EAN-13 with a 0)

"Search foods" ──► USDA (all data types) ∥ Open Food Facts search (≤ 8/min)
                    merged, de-duplicated (same barcode or brand+name;
                    USDA label data wins), ranked by word match + data quality

Photo guess ──► foods().bestMatch(name, { packaged }) ──► only returned when
                every word matches; otherwise keep the photo estimate
```

- Each food carries per-100 g numbers **and** one label serving when known, so
  "1.5 scoops" and "62 g" both work (`macrosForServings`, `macrosForGrams`).
- Data quality is shown in search results: *USDA · brand label*, *USDA · lab
  data*, *Open Food Facts*. Results stay editable on the result sheet, as the
  honesty rules in docs/product.md require.
- Results are cached in memory for the session. Partial failures are tolerated:
  if one source is down, the other's results still show.
- Search-logged entries are saved with source `manual`, because the entry
  source list is shared with sync and the database check constraint. A
  dedicated `search` source needs a migration (follow-up).

## Hooks for the photo / camera work

The photo analyser (`analyze-food`) estimates portions from a picture. For a
**packaged** item it recognises (a protein bar, a whey tub, a shake), the
label numbers are better than an estimate:

```ts
import { foods, foodToScannedItem } from '../foods';
const match = await foods().bestMatch('Quest cookies and cream protein bar', { packaged: true });
if (match) item = { ...foodToScannedItem(match), confidence: 0.95 };
```

For whole foods (chicken, rice, eggs), `bestMatch(name)` searches the USDA
generic tables; scale with `macrosForGrams(match, estimatedGrams)` using the
gram weight the model saw. Whether and how to use this in the photo flow is
left to the photo-scan work; nothing in `analyze.ts` was changed here.

## Setup

1. Get a free key at https://fdc.nal.usda.gov/api-key-signup.
2. `supabase secrets set USDA_API_KEY=<key>` and
   `supabase functions deploy food-search` (see supabase/README.md).
3. Without Supabase the app uses USDA's public `DEMO_KEY` (development only).
4. Open Food Facts needs nothing. Attribution ("Data from Open Food Facts,
   ODbL" and "USDA FoodData Central") belongs in Settings → About before launch.
