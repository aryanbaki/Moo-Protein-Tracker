# Food data: sources, cross-checking and the camera protein model

How Moo gets protein (and calorie, carb, fat and full label) numbers, how it
checks one source against another, and how a photo becomes protein grams.
Code: `src/features/foods/`. Edge Functions: `supabase/functions/food-search`,
`food-verify`, `analyze-food`.

Researched November 12, 2026. This sandbox could not reach the food APIs, so
mappers are tested against fixtures built from documented response shapes.
Facts below are marked **unconfirmed** where research could only reach
secondary sources; re-check them with normal web access before launch.

## 1. How MyFitnessPal does it, and why Moo doesn't copy it

MyFitnessPal's database is mostly user-entered label data plus licensed brand
data, which is why it has many duplicate and wrong entries. Its developer API
closed to the public years ago and is partner-only; scraping it would breach
its terms. Moo builds the same capability from free, openly licensed sources
and, unlike a single crowd database, checks them against each other.

## 2. Sources

| Source | Covers | Cost / key | Limits | Licence | Role in Moo |
| --- | --- | --- | --- | --- | --- |
| Open Food Facts | ~3M+ packaged foods worldwide, volunteer-entered | Free, no key; custom User-Agent | 100 product reads/min, 10 searches/min per IP | ODbL (attribution) | Barcode (always asked), search |
| USDA FoodData Central, Branded | US manufacturer label data with GTIN | Free api.data.gov key (Supabase secret) | 1,000 requests/hour/IP; DEMO_KEY far lower | Public domain (CC0) | Barcode (always asked), search |
| USDA FoodData Central, Foundation / SR Legacy / Survey | Lab-analysed generic foods | same | same | CC0 | Search; live fallback for photo densities |
| Bundled USDA SR Legacy table | 50 common protein foods, offline | none | none | CC0 | Photo densities, raw↔cooked yields |
| FatSecret Platform, Premier Free | Branded foods, US barcodes, largely manufacturer-submitted | Free after FatSecret verifies a start-up/student/non-profit | No call limit (Premier) | Attribution required; values may not be stored > 24 h | **Verification only** (`food-verify`), off until keys are set |

Rejected or deferred (details in the research notes in the PR):

- **Nutritionix**: free tier reportedly gone (around $499/mo; unconfirmed).
- **Edamam**: no free tier found; $14/mo Enterprise Basic is the paid fallback if FatSecret refuses.
- **Spoonacular**: about 4 UPC lookups/day free, and storing nutrition is forbidden.
- **API Ninjas / CalorieNinjas**: no barcode lookup, and protein is a premium field.
- **UPCitemdb / Barcode Lookup**: no structured nutrition.
- **Kroger**: nutrition fields unconfirmed.
- **Open Food Repo**: Swiss-only, already merged into Open Food Facts.
- **Canadian Nutrient File**: free and keyless, but mostly copied from USDA, so it can't serve as an independent check.
- **Quadram CoFID API**: non-commercial licence.
- **NEVO**: "unchanged only" licence.
- **AFCD**: share-alike licence.

For a later independent second opinion on generic foods, the candidates are:

- UK CoFID 2021: OGL v3, bulk file.
- Swedish Livsmedelsverket API: CC BY 4.0. Key and rate limits are unconfirmed.

## 3. Reliability levels (best first)

| Level | Shown as | Meaning |
| --- | --- | --- |
| `verified` | Verified | Two independent sources agree within tolerance (e.g. Open Food Facts and USDA Branded, or either plus FatSecret), or a label photo agrees with the product's database record |
| `label` | Brand data | USDA Branded (manufacturer label data), not independently confirmed |
| `reference` | USDA data | USDA lab data for a generic food |
| `community` | Community data | Open Food Facts alone |
| `label_photo` | From label | Numbers read off the nutrition label in a photo |
| `estimate` | Estimate | Food and portion estimated from a photo; shown with a protein range |

A record that fails its own consistency checks drops one level. The result
sheet shows the weakest level among its items, and a range when anything is
estimated.

**Independence.** Open Food Facts has bulk-imported USDA data. A product tagged
as imported from USDA (`data_sources_tags` containing "usda") does not count
as confirming USDA (check `not_independent`).

**What "verified" means.** Two independent transcriptions of the label agree;
this catches typing and unit errors. It does not prove the label is right. A
2025 survey found about a quarter of US protein products below their claim,
and amino-acid spiking inflates lab protein tests (unconfirmed figures). A
label-photo route therefore never ranks above verified.

## 4. Cross-check rules (`verify.ts`)

All comparisons are per 100 g. `S` is the smaller serving weight of the two
records, used for the rounding allowances.

- **Protein, two sources agree.** The values may differ by `band + rounding`:
  - The band is 2 g when the larger value is under 10 g, 20% of it from 10 to 40 g, and 8 g above 40 g. The 20% matches FDA's rule that naturally occurring protein must be at least 80% of the declared amount; the 8 g cap follows EU tolerance guidance. A flat 20% would allow 16 g of slack on an 80 g powder.
  - The rounding allowance is `min(0.5 × 100 / S, 5)` g, or 0.5 g when there is no serving. US labels round protein to 1 g per serving.
- **Calories, two sources agree.** The values may differ by `max(20, 20%) + min(5 × 100 / S, 40) + 2 × fibre`. This covers:
  - FDA's 120% ceiling on calories;
  - labels rounding calories to 5 or 10 kcal per serving;
  - labels counting fibre at 4, 2 or 0 kcal/g.
- **Energy consistency within a record**, using Open Food Facts' own thresholds:
  - From the macros, the lowest plausible energy is `4P + 4(C − fibre) + 9F`.
  - The highest is `4P + 4C + 9F`, plus `4 × fibre` for Open Food Facts records, where carbohydrate may exclude fibre.
  - Within ±15% + 5 kcal of that range it passes.
  - Within ±30% + 5 kcal it warns, without demoting.
  - Beyond that it fails and the record is demoted.
  - Records with 13 kcal per 100 g or less are skipped.
- **Hard limits**, which demote:
  - no single macro over 105 g per 100 g, and their sum no more than 105 g;
  - no more than 935 kcal per 100 g;
  - protein energy (4 × P) no more than 115% of declared energy + 5;
  - saturated fat no more than total fat, and sugars no more than carbohydrate;
  - per-100 g × serving weight must reproduce the per-serving protein.
- **Named disagreements.** When two sources disagree, the ratio between them is checked for three common data-entry slips:
  - near 100/S: per-serving values stored as per-100 g;
  - near 4.184: kilojoules entered as kcal;
  - near 10: a decimal shift.
- **Which record is shown:**
  - A record that passes its own checks beats one that fails.
  - Among those, manufacturer label beats lab reference, which beats community data.
  - FatSecret is never shown or logged, because its terms forbid storing its values.

Not yet done (see section 9):

- reading OFF `carbohydrates-total` and the `_modifier` fields;
- treating "<1 g" values as intervals;
- the nitrogen-factor allowance when comparing an EU label with a USDA generic food.

## 5. Full nutrition panel (`panel.ts`)

The panel reads 22 label nutrients:

- calories;
- total fat, saturated, trans, monounsaturated and polyunsaturated fat;
- cholesterol and sodium;
- carbohydrate, fibre, total sugars and added sugars;
- protein;
- vitamin D, calcium, iron, potassium, magnesium, zinc, vitamin A, vitamin C;
- caffeine.

How each source is read:

- **USDA.** Nutrients are matched by FDC id, then by legacy number; names are never used, because they change between releases. Units are converted: G, MG and UG, kcal and kJ. IU values are not converted.
- **Open Food Facts.** `<key>_100g` values are stored in grams and converted to mg or µg for display. Sodium is derived from salt as salt ÷ 2.5.
- **Edge Function.** `food-search` passes through every id the panel reads; a test enforces this.
- **Display.** The panel appears after barcode scans and searches, scaled to the amount being logged.

Research suggested further fallbacks that are not built yet:

- fat 1085;
- vitamin D 1110 IU × 0.025;
- USDA `labelNutrients` from the details endpoint for per-serving display.

## 6. Camera → protein (`estimate.ts`)

The analyser (Claude vision with a strict tool schema) names each food and
estimates the portion. Research found that weight is the main source of error
for vision models, and that identifying the food and then looking up its
density beats asking the model for protein directly. Reported errors from
studies recalled without access to the papers (**unconfirmed**):

- Nutrition5k RGB model: about 29% protein MAE.
- General vision LLMs: about 30–50% weight error, with large portions underestimated.

So the tool now also returns, per item:

- `kind`: packaged, whole_food, mixed_dish or drink;
- `grams`, `grams_low` and `grams_high`;
- `cook_state`;
- `db_query`;
- `brand` and `product`;
- `barcode` digits, only if legible;
- the `label` numbers per serving, only if printed and legible;
- `servings`.

The routes, best first:

1. **Barcode digits in the photo.** The cross-checked database record × servings is used. If a label is also visible and agrees with the record, the result is `verified`.
2. **Readable nutrition label.** The label's per-serving numbers × servings are used. The range is ±0.5 g per serving, because labels round to 1 g. The result is `verified` when the product's database record agrees on protein per serving (±1 g + 20%), and flagged when it doesn't.
3. **Recognised package (brand + product).** The database label record × servings is used.
4. **Whole food.** Protein = density × grams.
   - Density comes from the bundled USDA table, else the best live USDA generic match.
   - The range is density × `grams_low` to density × `grams_high` (±25% if those weren't given).
   - Meat and fish with an unknown cook state are assumed cooked. Raw weights use the table's yield. Cooked meat has about 35–40% more protein per gram than raw, so this matters.
   - Mixed dishes never borrow a single food's density.
5. **Model only.** The analyser's own numbers are used with a ±40–60% range.

How the analyser's own protein guess is used:

- It is never logged when a database value exists.
- Within ±35% of the computed value it raises confidence.
- Beyond that it widens the range to include itself and lowers confidence.

Database lookups during a scan time out after 4 s and fall through to the next
route; the estimator never throws.

Barcodes are checked before any lookup:

- **Check digit.** A scanned code with a wrong GS1 check digit is a misread and is rejected before any API call. 8-digit codes are let through, because they may be UPC-E.
- **USDA form.** iPhones report UPC-A as a 13-digit EAN with a leading 0, while USDA stores 12 digits. The USDA query drops leading zeros, and the match ignores them.

What would improve accuracy next, from the research:

- Make the weight one tap away: portion chips, or an "I weighed it" field. The grams field already exists for database foods, and per-item grams for photo items is next.
- Ask for an overhead shot plus an angled one, with a hand or fork for scale.
- Ask the model which label column it read and whether each field was legible.
- Ask for a re-shoot when the label's macros don't add up.
- Add a second, independent label reader on the device. Apple Vision (`VNRecognizeTextRequest`, or `RecognizeDocumentsRequest` on iOS 26+) would run in a small local Expo module, with a pure TypeScript parser for the protein row and serving size. When the on-device read and Claude's read agree, the label photo becomes verified; when they disagree, the app shows both and asks.
  - Research advised against ML Kit and VisionCamera OCR plugins for this iPhone-only app, because they add Google pods and their maintenance is stale.
- Add a raw/cooked toggle on photo results. The wrong state alone costs −27% to +39% of protein for meat, and 2.3–2.7× for legumes.
- Privacy items for the app's owner of `app.json` and the scan flow:
  - set `microphonePermission: false` on the expo-camera and image-picker plugins;
  - mention barcodes, labels and meals in the camera purpose string;
  - add a one-time consent sheet before the first photo goes to Anthropic (App Store guideline 5.1.2(i)).

## 7. The bundled reference table (`reference-data.ts`)

The table was generated, not hand-typed:

- **Source data.** USDA FoodData Central SR Legacy CSVs (`food.csv`, `food_nutrient.csv`, `food_portion.csv`, publication date 2019-04-01). They were downloaded from four unrelated GitHub mirrors whose files are byte-identical (sha256 of `food_nutrient.csv` starts `6d07e6fc`).
- **Values.** Each row takes nutrients 1003, 1008, 1005 and 1004 from the SR record named in its comment.
- **Portions.** Typical portions are that record's own USDA household measures.
- **Yields.** `cookedYield` = raw-record protein ÷ cooked-record protein, since protein is conserved in cooking. This reproduces USDA's raw chicken breast (22.5 g) from the roasted value.
- **Independent checks.** Two separate web lookups agreed with the generated values for all eight foods they completed (chicken breast and thigh, 85% ground beef, sirloin, pork tenderloin, turkey breast, salmon, canned tuna). A third agent read USDA's SR table from a different copy (the CRAN package NutrienTrackeR) and matched every row it shared with the table.
- **Shrimp** uses USDA's plain "Crustaceans, shrimp, cooked" record (23.98 g), not the mixed-species record with moisture additives.
- **Disagreeing records.** Where USDA's own records for a food disagree, the row carries a protein range that widens photo estimates. Canned light tuna in water is 19.44 g salted vs 25.51 g no-salt.
- **Left out:** SR's "whey protein powder isolate" (58 g protein with 29 g carbohydrate, not representative; powders come from their label) and "chopped and formed" jerky.
- **Matching.** Every core word of an alias must appear; preparation words never decide a match; plurals are folded. Exclusion words keep out look-alikes such as almond milk, nuggets, egg noodles and fried rice.

To regenerate, follow scripts/food-reference/README.md. Don't edit numbers by hand.

## 8. Setup

1. Get a free USDA key at https://fdc.nal.usda.gov/api-key-signup, set it with `supabase secrets set USDA_API_KEY=…`, and run `supabase functions deploy food-search`. Without it, the app uses `DEMO_KEY`, which is for development only.
2. Optional third opinion: apply for FatSecret Premier Free, set `FATSECRET_CLIENT_ID` and `FATSECRET_CLIENT_SECRET`, and deploy `food-verify`. See supabase/README.md for the IP-allowlist caveat.
3. Credits are shown in Settings → About:
   - "Open Food Facts · ODbL"
   - "USDA FoodData Central · public domain"
   - "Powered by FatSecret"

## 9. Open questions

- None of the APIs could be called from this sandbox. Check one barcode and one search per source on a real network.
- FatSecret: confirm the `food.find_id_for_barcode` and `food.get.v4` response shapes, and whether the IP allowlist accepts 0.0.0.0/0.
- Open Food Facts v3.5+ stores nutrition per source (`aggregated_set`). Reading it would detect USDA-copied values precisely, rather than by tag.
- Verify the studies' accuracy figures, the exact eCFR protein rounding wording, and the EU tolerance table's protein row once those sites are reachable.
- Decide whether to add UK CoFID as a second column in the bundled table, which would give "verified" generic foods.
