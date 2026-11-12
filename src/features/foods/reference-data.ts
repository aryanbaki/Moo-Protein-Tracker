/**
 * Bundled protein-density table, generated from USDA FoodData Central SR Legacy
 * (final release, public domain) by docs/food-data.md's procedure: values are
 * USDA's per-100 g protein (1003), energy (1008), carbohydrate (1005) and fat
 * (1004) for the record named in each comment; typical portions are USDA's own
 * household measures for that record. cookedYield (cooked ÷ raw weight) is
 * derived from the matching raw record as raw protein ÷ cooked protein, since
 * protein is conserved in cooking. Do not hand-edit numbers; regenerate.
 */
import type { ReferenceFood } from './reference';

export const REFERENCE_FOODS: ReferenceFood[] = [
  // Chicken, broilers or fryers, breast, meat only, cooked, roasted
  { key: 'chicken-breast-roasted', name: 'Chicken breast, roasted', aliases: ['chicken breast'], state: 'cooked', per100g: { proteinG: 31.02, calories: 165, carbsG: 0, fatG: 3.57 }, fdcId: 171477, cookedYield: 0.725, typicalPortion: { label: '½ breast, bone and skin removed', grams: 86 }, exclude: ['nugget', 'breaded', 'tender', 'katsu', 'schnitzel', 'battered', 'popcorn'] },
  // Chicken, broilers or fryers, thigh, meat only, cooked, roasted
  { key: 'chicken-thigh-roasted', name: 'Chicken thigh, roasted', aliases: ['chicken thigh'], state: 'cooked', per100g: { proteinG: 24.76, calories: 179, carbsG: 0, fatG: 8.15 }, fdcId: 172388, typicalPortion: { label: '1 thigh without skin', grams: 116 }, exclude: ['breaded', 'battered'] },
  // Beef, ground, 85% lean meat / 15% fat, crumbles, cooked, pan-browned
  { key: 'ground-beef-85-browned', name: 'Ground beef 85% lean, browned', aliases: ['ground beef', 'beef mince', 'minced beef'], state: 'cooked', per100g: { proteinG: 27.73, calories: 256, carbsG: 0, fatG: 15.3 }, fdcId: 174034, cookedYield: 0.67, typicalPortion: { label: '3 oz', grams: 85 }, exclude: ['lean', 'raw'] },
  // Beef, ground, 90% lean meat / 10% fat, crumbles, cooked, pan-browned
  { key: 'ground-beef-90-browned', name: 'Ground beef 90% lean, browned', aliases: ['lean ground beef', 'lean beef mince'], state: 'cooked', per100g: { proteinG: 28.45, calories: 230, carbsG: 0, fatG: 12.04 }, fdcId: 171794, typicalPortion: { label: '3 oz', grams: 85 } },
  // Beef, top sirloin, steak, separable lean only, trimmed to 1/8" fat, all grades, cooked, broiled
  { key: 'beef-sirloin-broiled', name: 'Beef sirloin steak, broiled', aliases: ['sirloin', 'beef steak'], state: 'cooked', per100g: { proteinG: 29.42, calories: 178, carbsG: 0, fatG: 5.84 }, fdcId: 174054, cookedYield: 0.751, typicalPortion: { label: '3 oz', grams: 85 } },
  // Pork, fresh, loin, tenderloin, separable lean only, cooked, roasted
  { key: 'pork-tenderloin-roasted', name: 'Pork tenderloin, roasted', aliases: ['pork tenderloin', 'pork loin'], state: 'cooked', per100g: { proteinG: 26.17, calories: 143, carbsG: 0, fatG: 3.51 }, fdcId: 168250, cookedYield: 0.801, typicalPortion: { label: '3 oz', grams: 85 } },
  // Turkey, whole, breast, meat only, cooked, roasted
  { key: 'turkey-breast-roasted', name: 'Turkey breast, roasted', aliases: ['turkey breast'], state: 'cooked', per100g: { proteinG: 30.13, calories: 147, carbsG: 0, fatG: 2.08 }, fdcId: 171496, cookedYield: 0.785, typicalPortion: { label: '3 oz', grams: 85 } },
  // Turkey, Ground, cooked
  { key: 'turkey-ground-cooked', name: 'Ground turkey, cooked', aliases: ['ground turkey', 'turkey mince'], state: 'cooked', per100g: { proteinG: 27.37, calories: 203, carbsG: 0, fatG: 10.4 }, fdcId: 171506, typicalPortion: { label: '3 oz', grams: 85 } },
  // Fish, salmon, Atlantic, farmed, cooked, dry heat
  { key: 'salmon-atlantic-farmed-cooked', name: 'Salmon (Atlantic, farmed), cooked', aliases: ['salmon'], state: 'cooked', per100g: { proteinG: 22.1, calories: 206, carbsG: 0, fatG: 12.35 }, fdcId: 175168, cookedYield: 0.924, typicalPortion: { label: '½ fillet', grams: 178 }, exclude: ['smoked', 'canned', 'roe'] },
  // Fish, salmon, sockeye, cooked, dry heat
  { key: 'salmon-sockeye-cooked', name: 'Sockeye salmon, cooked', aliases: ['sockeye salmon', 'wild salmon'], state: 'cooked', per100g: { proteinG: 26.48, calories: 156, carbsG: 0, fatG: 5.57 }, fdcId: 173692, typicalPortion: { label: '½ fillet', grams: 155 } },
  // Fish, tuna, light, canned in water, drained solids (Includes foods for USDA's Food Distribution Program); range includes 171986 Fish, tuna, light, canned in water, without salt, drained solids
  { key: 'tuna-light-canned-water', name: 'Tuna, light, canned in water, drained', aliases: ['canned tuna', 'tinned tuna', 'tuna in water'], state: 'as_sold', per100g: { proteinG: 19.44, calories: 86, carbsG: 0, fatG: 0.96 }, fdcId: 173709, typicalPortion: { label: '1 can', grams: 165 }, proteinRange100g: { lowG: 19.44, highG: 25.51 }, exclude: ['oil', 'salad', 'steak', 'sushi'] },
  // Fish, cod, Atlantic, cooked, dry heat
  { key: 'cod-atlantic-cooked', name: 'Cod, cooked', aliases: ['cod'], state: 'cooked', per100g: { proteinG: 22.83, calories: 105, carbsG: 0, fatG: 0.86 }, fdcId: 171956, cookedYield: 0.78, typicalPortion: { label: '1 fillet', grams: 180 }, exclude: ['battered', 'breaded'] },
  // Fish, tilapia, cooked, dry heat
  { key: 'tilapia-cooked', name: 'Tilapia, cooked', aliases: ['tilapia'], state: 'cooked', per100g: { proteinG: 26.15, calories: 128, carbsG: 0, fatG: 2.65 }, fdcId: 175177, cookedYield: 0.768, typicalPortion: { label: '1 fillet', grams: 87 }, exclude: ['battered', 'breaded'] },
  // Crustaceans, shrimp, cooked
  { key: 'shrimp-cooked', name: 'Shrimp, cooked', aliases: ['shrimp', 'prawn'], state: 'cooked', per100g: { proteinG: 23.98, calories: 99, carbsG: 0.2, fatG: 0.28 }, fdcId: 175180, cookedYield: 0.838, typicalPortion: { label: '3 oz', grams: 85 }, exclude: ['breaded', 'tempura', 'battered', 'popcorn'] },
  // Egg, whole, cooked, hard-boiled
  { key: 'egg-hard-boiled', name: 'Egg, hard-boiled', aliases: ['egg', 'hard boiled egg'], state: 'cooked', per100g: { proteinG: 12.58, calories: 155, carbsG: 1.12, fatG: 10.61 }, fdcId: 173424, typicalPortion: { label: '1 large', grams: 50 }, exclude: ['noodle', 'substitute', 'plant', 'eggplant', 'nog', 'roll'] },
  // Egg, whole, cooked, scrambled
  { key: 'egg-scrambled', name: 'Egg, scrambled', aliases: ['scrambled egg'], state: 'cooked', per100g: { proteinG: 9.99, calories: 149, carbsG: 1.61, fatG: 10.98 }, fdcId: 172187, typicalPortion: { label: '1 large', grams: 61 }, exclude: ['substitute', 'plant', 'tofu'] },
  // Egg, white, raw, fresh
  { key: 'egg-white-raw', name: 'Egg white', aliases: ['egg white'], state: 'raw', per100g: { proteinG: 10.9, calories: 52, carbsG: 0.73, fatG: 0.17 }, fdcId: 172183, typicalPortion: { label: '1 large', grams: 33 }, exclude: ['substitute'] },
  // Yogurt, Greek, plain, nonfat (Includes foods for USDA's Food Distribution Program)
  { key: 'greek-yogurt-nonfat', name: 'Greek yogurt, plain, nonfat', aliases: ['greek yogurt', 'nonfat greek yogurt'], state: 'as_sold', per100g: { proteinG: 10.19, calories: 59, carbsG: 3.6, fatG: 0.39 }, fdcId: 170894, typicalPortion: { label: '1 container', grams: 170 }, exclude: ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free', 'frozen', 'whole', 'lowfat', 'low'] },
  // Yogurt, Greek, plain, lowfat
  { key: 'greek-yogurt-lowfat', name: 'Greek yogurt, plain, low-fat', aliases: ['lowfat greek yogurt', 'low fat greek yogurt'], state: 'as_sold', per100g: { proteinG: 9.95, calories: 73, carbsG: 3.94, fatG: 1.92 }, fdcId: 170903, typicalPortion: { label: '1 container (7 oz)', grams: 200 } },
  // Yogurt, plain, whole milk
  { key: 'yogurt-plain-whole', name: 'Yogurt, plain, whole milk', aliases: ['yogurt', 'plain yogurt'], state: 'as_sold', per100g: { proteinG: 3.47, calories: 61, carbsG: 4.66, fatG: 3.25 }, fdcId: 171284, typicalPortion: { label: '1 cup (8 fl oz)', grams: 245 }, exclude: ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free', 'frozen', 'greek', 'drink'] },
  // Cheese, cottage, lowfat, 2% milkfat
  { key: 'cottage-cheese-2', name: 'Cottage cheese, 2%', aliases: ['cottage cheese'], state: 'as_sold', per100g: { proteinG: 10.45, calories: 81, carbsG: 4.76, fatG: 2.27 }, fdcId: 172182, typicalPortion: { label: '4 oz', grams: 113 } },
  // Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D
  { key: 'milk-2', name: 'Milk, 2%', aliases: ['milk'], state: 'as_sold', per100g: { proteinG: 3.3, calories: 50, carbsG: 4.8, fatG: 1.98 }, fdcId: 171267, typicalPortion: { label: '1 cup', grams: 244 }, exclude: ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free', 'whole', 'skim', 'nonfat', 'chocolate', 'condensed', 'evaporated', 'powder', 'shake', 'coconut'] },
  // Milk, whole, 3.25% milkfat, with added vitamin D
  { key: 'milk-whole', name: 'Milk, whole', aliases: ['whole milk'], state: 'as_sold', per100g: { proteinG: 3.15, calories: 61, carbsG: 4.8, fatG: 3.25 }, fdcId: 171265, typicalPortion: { label: '1 cup', grams: 244 }, exclude: ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free', 'chocolate', 'condensed', 'evaporated', 'powder'] },
  // Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)
  { key: 'milk-skim', name: 'Milk, skim', aliases: ['skim milk', 'nonfat milk', 'fat free milk'], state: 'as_sold', per100g: { proteinG: 3.37, calories: 34, carbsG: 4.96, fatG: 0.08 }, fdcId: 171269, typicalPortion: { label: '1 cup', grams: 245 }, exclude: ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free', 'chocolate', 'powder'] },
  // Cheese, cheddar (Includes foods for USDA's Food Distribution Program)
  { key: 'cheddar', name: 'Cheddar cheese', aliases: ['cheddar'], state: 'as_sold', per100g: { proteinG: 22.87, calories: 403, carbsG: 3.37, fatG: 33.31 }, fdcId: 173414, typicalPortion: { label: '1 oz', grams: 28.35 }, exclude: ['cracker', 'sauce'] },
  // Cheese, mozzarella, part skim milk
  { key: 'mozzarella-part-skim', name: 'Mozzarella, part skim', aliases: ['mozzarella'], state: 'as_sold', per100g: { proteinG: 24.26, calories: 254, carbsG: 2.77, fatG: 15.92 }, fdcId: 170847, typicalPortion: { label: '1 oz', grams: 28.35 }, exclude: ['stick', 'fried'] },
  // Cheese, parmesan, grated
  { key: 'parmesan-grated', name: 'Parmesan, grated', aliases: ['parmesan'], state: 'as_sold', per100g: { proteinG: 28.42, calories: 420, carbsG: 13.91, fatG: 27.84 }, fdcId: 171247, typicalPortion: { label: '1 tbsp', grams: 5 } },
  // Tofu, raw, firm, prepared with calcium sulfate
  { key: 'tofu-firm', name: 'Tofu, firm', aliases: ['tofu'], state: 'as_sold', per100g: { proteinG: 17.27, calories: 144, carbsG: 2.78, fatG: 8.72 }, fdcId: 172475, typicalPortion: { label: '¼ block', grams: 81 }, exclude: ['silken', 'fried', 'skin'] },
  // Tempeh
  { key: 'tempeh', name: 'Tempeh', aliases: ['tempeh'], state: 'as_sold', per100g: { proteinG: 20.29, calories: 192, carbsG: 7.64, fatG: 10.8 }, fdcId: 174272, typicalPortion: { label: '1 cup', grams: 166 } },
  // Lentils, mature seeds, cooked, boiled, without salt
  { key: 'lentils-boiled', name: 'Lentils, boiled', aliases: ['lentil'], state: 'cooked', per100g: { proteinG: 9.02, calories: 116, carbsG: 20.13, fatG: 0.38 }, fdcId: 172421, cookedYield: 2.731, typicalPortion: { label: '1 cup', grams: 198 }, exclude: ['soup', 'pasta', 'chip'] },
  // Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt
  { key: 'chickpeas-boiled', name: 'Chickpeas, boiled', aliases: ['chickpea', 'garbanzo'], state: 'cooked', per100g: { proteinG: 8.86, calories: 164, carbsG: 27.42, fatG: 2.59 }, fdcId: 173757, cookedYield: 2.31, typicalPortion: { label: '1 cup', grams: 164 }, exclude: ['pasta', 'flour', 'roasted'] },
  // Beans, black, mature seeds, cooked, boiled, without salt
  { key: 'black-beans-boiled', name: 'Black beans, boiled', aliases: ['black bean'], state: 'cooked', per100g: { proteinG: 8.86, calories: 132, carbsG: 23.71, fatG: 0.54 }, fdcId: 173735, cookedYield: 2.438, typicalPortion: { label: '1 cup', grams: 172 }, exclude: ['soup', 'pasta', 'refried'] },
  // Beans, kidney, all types, mature seeds, cooked, boiled, without salt
  { key: 'kidney-beans-boiled', name: 'Kidney beans, boiled', aliases: ['kidney bean'], state: 'cooked', per100g: { proteinG: 8.67, calories: 127, carbsG: 22.8, fatG: 0.5 }, fdcId: 173740, cookedYield: 2.72, typicalPortion: { label: '1 cup', grams: 177 }, exclude: ['chili'] },
  // Edamame, frozen, prepared
  { key: 'edamame', name: 'Edamame, prepared', aliases: ['edamame'], state: 'cooked', per100g: { proteinG: 11.91, calories: 121, carbsG: 8.91, fatG: 5.2 }, fdcId: 168411, typicalPortion: { label: '1 cup', grams: 155 } },
  // Hummus, commercial
  { key: 'hummus', name: 'Hummus', aliases: ['hummus'], state: 'as_sold', per100g: { proteinG: 7.78, calories: 237, carbsG: 15, fatG: 17.82 }, fdcId: 174289, typicalPortion: { label: '1 tbsp', grams: 15 } },
  // Peanut butter, smooth style, without salt
  { key: 'peanut-butter', name: 'Peanut butter, smooth', aliases: ['peanut butter'], state: 'as_sold', per100g: { proteinG: 22.21, calories: 598, carbsG: 22.31, fatG: 51.36 }, fdcId: 172470, typicalPortion: { label: '2 tbsp', grams: 32 }, exclude: ['cookie', 'cup', 'sandwich'] },
  // Nuts, almonds
  { key: 'almonds', name: 'Almonds', aliases: ['almond'], state: 'as_sold', per100g: { proteinG: 21.15, calories: 579, carbsG: 21.55, fatG: 49.93 }, fdcId: 170567, typicalPortion: { label: '1 oz (23 whole kernels)', grams: 28.35 }, exclude: ['milk', 'butter', 'flour', 'yogurt'] },
  // Seeds, pumpkin and squash seed kernels, roasted, without salt
  { key: 'pumpkin-seeds', name: 'Pumpkin seeds, roasted', aliases: ['pumpkin seed', 'pepita'], state: 'as_sold', per100g: { proteinG: 29.84, calories: 574, carbsG: 14.71, fatG: 49.05 }, fdcId: 170557, typicalPortion: { label: '1 oz', grams: 28.35 } },
  // Ham, sliced, pre-packaged, deli meat (96%fat free, water added)
  { key: 'ham-deli', name: 'Ham, deli slices', aliases: ['ham', 'deli ham'], state: 'as_sold', per100g: { proteinG: 16.85, calories: 107, carbsG: 0.7, fatG: 4.04 }, fdcId: 173863, typicalPortion: { label: '1 slice', grams: 13 }, exclude: ['hamburger', 'burger', 'steak'] },
  // Pork, cured, bacon, pre-sliced, cooked, pan-fried
  { key: 'bacon', name: 'Bacon, pan-fried', aliases: ['bacon'], state: 'cooked', per100g: { proteinG: 33.92, calories: 468, carbsG: 1.7, fatG: 35.09 }, fdcId: 168322, typicalPortion: { label: '1 slice', grams: 11.5 }, exclude: ['turkey', 'bit', 'vegan'] },
  // Rice, white, long-grain, regular, enriched, cooked
  { key: 'rice-white-cooked', name: 'White rice, cooked', aliases: ['rice'], state: 'cooked', per100g: { proteinG: 2.69, calories: 130, carbsG: 28.17, fatG: 0.28 }, fdcId: 168878, cookedYield: 2.651, typicalPortion: { label: '1 cup', grams: 158 }, exclude: ['milk', 'cake', 'cracker', 'noodle', 'fried', 'brown', 'pudding', 'krispie'] },
  // Quinoa, cooked
  { key: 'quinoa-cooked', name: 'Quinoa, cooked', aliases: ['quinoa'], state: 'cooked', per100g: { proteinG: 4.4, calories: 120, carbsG: 21.3, fatG: 1.92 }, fdcId: 168917, cookedYield: 3.209, typicalPortion: { label: '1 cup', grams: 185 } },
  // Cereals, oats, regular and quick, unenriched, cooked with water (includes boiling and microwaving), without salt
  { key: 'oatmeal-cooked', name: 'Oatmeal, cooked with water', aliases: ['oatmeal', 'porridge'], state: 'cooked', per100g: { proteinG: 2.54, calories: 71, carbsG: 12, fatG: 1.52 }, fdcId: 173905, typicalPortion: { label: '1 cup', grams: 234 }, exclude: ['cookie', 'bar'] },
  // Cereals, oats, regular and quick, not fortified, dry
  { key: 'oats-dry', name: 'Oats, dry', aliases: ['dry oats', 'uncooked oats'], state: 'as_sold', per100g: { proteinG: 13.15, calories: 379, carbsG: 67.7, fatG: 6.52 }, fdcId: 173904, typicalPortion: { label: '⅓ cup', grams: 27 } },
  // Pasta, cooked, enriched, without added salt
  { key: 'pasta-cooked', name: 'Pasta, cooked', aliases: ['pasta', 'spaghetti', 'penne', 'macaroni'], state: 'cooked', per100g: { proteinG: 5.8, calories: 158, carbsG: 30.86, fatG: 0.93 }, fdcId: 169737, cookedYield: 2.248, typicalPortion: { label: '1 cup spaghetti not packed', grams: 124 }, exclude: ['salad', 'sauce'] },
  // Bread, whole-wheat, commercially prepared
  { key: 'bread-whole-wheat', name: 'Whole-wheat bread', aliases: ['whole wheat bread', 'wholemeal bread'], state: 'as_sold', per100g: { proteinG: 12.45, calories: 252, carbsG: 42.71, fatG: 3.5 }, fdcId: 172688, typicalPortion: { label: '1 slice', grams: 32 } },
  // Bread, white, commercially prepared (includes soft bread crumbs)
  { key: 'bread-white', name: 'White bread', aliases: ['bread', 'white bread', 'toast'], state: 'as_sold', per100g: { proteinG: 8.85, calories: 266, carbsG: 49.42, fatG: 3.33 }, fdcId: 174924, typicalPortion: { label: '1 slice', grams: 29 }, exclude: ['whole', 'wheat', 'wholemeal', 'french', 'garlic', 'banana', 'pita', 'naan', 'stick', 'crumb'] },
  // Potatoes, baked, flesh and skin, without salt
  { key: 'potato-baked', name: 'Potato, baked', aliases: ['potato'], state: 'cooked', per100g: { proteinG: 2.5, calories: 93, carbsG: 21.15, fatG: 0.13 }, fdcId: 170093, typicalPortion: { label: '1 potato medium', grams: 173 }, exclude: ['chip', 'crisp', 'fries', 'fry', 'sweet', 'mashed', 'salad', 'hash'] },
  // Broccoli, cooked, boiled, drained, without salt
  { key: 'broccoli-boiled', name: 'Broccoli, boiled', aliases: ['broccoli'], state: 'cooked', per100g: { proteinG: 2.38, calories: 35, carbsG: 7.18, fatG: 0.41 }, fdcId: 169967, typicalPortion: { label: '½ cup, chopped', grams: 78 } },
  // Peas, green, frozen, cooked, boiled, drained, without salt
  { key: 'peas-green-cooked', name: 'Green peas, cooked', aliases: ['green pea', 'pea'], state: 'cooked', per100g: { proteinG: 5.15, calories: 78, carbsG: 14.26, fatG: 0.27 }, fdcId: 170017, typicalPortion: { label: '½ cup', grams: 80 }, exclude: ['chickpea', 'snow', 'snap', 'protein', 'soup', 'split'] },
];
