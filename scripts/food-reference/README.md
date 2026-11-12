# Regenerating the bundled protein table

`src/features/foods/reference-data.ts` is generated from USDA FoodData Central
SR Legacy (public domain). Do not edit its numbers by hand.

1. Download the SR Legacy CSV release from https://fdc.nal.usda.gov/download-datasets
   and unzip it into a new, empty folder outside the repository. You need
   `food.csv`, `food_nutrient.csv`, `food_portion.csv` and `measure_unit.csv`.
   (The current table used the 2019-04-01 files; `food_nutrient.csv` sha256 starts `6d07e6fc`.)
2. Extract the records listed in `spec.json`. It needs Python 3 only.

   ```sh
   python3 -I scripts/food-reference/extract.py <data folder> scripts/food-reference/spec.json /tmp/ref.json
   ```

3. Generate the TypeScript (names, aliases, exclusions and portion choices live in `gen.py`):

   ```sh
   python3 -I scripts/food-reference/gen.py /tmp/ref.json src/features/foods/reference-data.ts
   ```

4. Run `npm test`. `reference.test.ts` checks every row's energy consistency and the alias matching.

`cookedYield` is the raw record's protein divided by the cooked record's
protein (protein is conserved in cooking), for rows with a `raw` id in `spec.json`.
