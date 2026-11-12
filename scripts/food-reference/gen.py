"""Generates src/features/foods/reference-data.ts from the extracted USDA rows. Args: <ref.json> <out.ts>."""
import json, sys
rows = {r['key']: r for r in json.load(open(sys.argv[1]))}
# key: (display name, aliases, state, portion label as USDA lists it, use derived yield?)
CHOICES = [
 ('chicken-breast-roasted', 'Chicken breast, roasted', ['chicken breast'], 'cooked', '0.5 breast, bone and skin removed', True),
 ('chicken-thigh-roasted', 'Chicken thigh, roasted', ['chicken thigh'], 'cooked', '1 thigh without skin', False),
 ('ground-beef-85-browned', 'Ground beef 85% lean, browned', ['ground beef', 'beef mince', 'minced beef'], 'cooked', '3 oz', True),
 ('ground-beef-90-browned', 'Ground beef 90% lean, browned', ['lean ground beef', 'lean beef mince'], 'cooked', '3 oz', False),
 ('beef-sirloin-broiled', 'Beef sirloin steak, broiled', ['sirloin', 'beef steak'], 'cooked', '3 oz', True),
 ('pork-tenderloin-roasted', 'Pork tenderloin, roasted', ['pork tenderloin', 'pork loin'], 'cooked', '3 oz', True),
 ('turkey-breast-roasted', 'Turkey breast, roasted', ['turkey breast'], 'cooked', '3 oz', True),
 ('turkey-ground-cooked', 'Ground turkey, cooked', ['ground turkey', 'turkey mince'], 'cooked', '3 oz', False),
 ('salmon-atlantic-farmed-cooked', 'Salmon (Atlantic, farmed), cooked', ['salmon'], 'cooked', '0.5 fillet', True),
 ('salmon-sockeye-cooked', 'Sockeye salmon, cooked', ['sockeye salmon', 'wild salmon'], 'cooked', '0.5 fillet', False),
 ('tuna-light-canned-water', 'Tuna, light, canned in water, drained', ['canned tuna', 'tinned tuna', 'tuna in water'], 'as_sold', '1 can', False),
 ('cod-atlantic-cooked', 'Cod, cooked', ['cod'], 'cooked', '1 fillet', True),
 ('tilapia-cooked', 'Tilapia, cooked', ['tilapia'], 'cooked', '1 fillet', True),
 ('shrimp-cooked', 'Shrimp, cooked', ['shrimp', 'prawn'], 'cooked', '3 oz', False),
 ('egg-hard-boiled', 'Egg, hard-boiled', ['egg', 'hard boiled egg'], 'cooked', '1 large', False),
 ('egg-scrambled', 'Egg, scrambled', ['scrambled egg'], 'cooked', '1 large', False),
 ('egg-white-raw', 'Egg white', ['egg white'], 'raw', '1 large', False),
 ('greek-yogurt-nonfat', 'Greek yogurt, plain, nonfat', ['greek yogurt', 'nonfat greek yogurt'], 'as_sold', '1 container', False),
 ('greek-yogurt-lowfat', 'Greek yogurt, plain, low-fat', ['lowfat greek yogurt', 'low fat greek yogurt'], 'as_sold', '1 container (7 oz)', False),
 ('yogurt-plain-whole', 'Yogurt, plain, whole milk', ['yogurt', 'plain yogurt'], 'as_sold', '1 cup (8 fl oz)', False),
 ('cottage-cheese-2', 'Cottage cheese, 2%', ['cottage cheese'], 'as_sold', '4 oz', False),
 ('milk-2', 'Milk, 2%', ['milk'], 'as_sold', '1 cup', False),
 ('milk-whole', 'Milk, whole', ['whole milk'], 'as_sold', '1 cup', False),
 ('milk-skim', 'Milk, skim', ['skim milk', 'nonfat milk', 'fat free milk'], 'as_sold', '1 cup', False),
 ('cheddar', 'Cheddar cheese', ['cheddar'], 'as_sold', '1 oz', False),
 ('mozzarella-part-skim', 'Mozzarella, part skim', ['mozzarella'], 'as_sold', '1 oz', False),
 ('parmesan-grated', 'Parmesan, grated', ['parmesan'], 'as_sold', '1 tbsp', False),
 ('tofu-firm', 'Tofu, firm', ['tofu'], 'as_sold', '0.25 block', False),
 ('tempeh', 'Tempeh', ['tempeh'], 'as_sold', '1 cup', False),
 ('lentils-boiled', 'Lentils, boiled', ['lentil'], 'cooked', '1 cup', True),
 ('chickpeas-boiled', 'Chickpeas, boiled', ['chickpea', 'garbanzo'], 'cooked', '1 cup', True),
 ('black-beans-boiled', 'Black beans, boiled', ['black bean'], 'cooked', '1 cup', True),
 ('kidney-beans-boiled', 'Kidney beans, boiled', ['kidney bean'], 'cooked', '1 cup', True),
 ('edamame', 'Edamame, prepared', ['edamame'], 'cooked', '1 cup', False),
 ('hummus', 'Hummus', ['hummus'], 'as_sold', '1 tbsp', False),
 ('peanut-butter', 'Peanut butter, smooth', ['peanut butter'], 'as_sold', '2 tbsp', False),
 ('almonds', 'Almonds', ['almond'], 'as_sold', '1 oz (23 whole kernels)', False),
 ('pumpkin-seeds', 'Pumpkin seeds, roasted', ['pumpkin seed', 'pepita'], 'as_sold', '1 oz', False),
 ('ham-deli', 'Ham, deli slices', ['ham', 'deli ham'], 'as_sold', '1 slice', False),
 ('bacon', 'Bacon, pan-fried', ['bacon'], 'cooked', '1 slice', False),
 ('rice-white-cooked', 'White rice, cooked', ['rice'], 'cooked', '1 cup', True),
 ('quinoa-cooked', 'Quinoa, cooked', ['quinoa'], 'cooked', '1 cup', True),
 ('oatmeal-cooked', 'Oatmeal, cooked with water', ['oatmeal', 'porridge'], 'cooked', '1 cup', False),
 ('oats-dry', 'Oats, dry', ['dry oats', 'uncooked oats'], 'as_sold', '0.33 cup', False),
 ('pasta-cooked', 'Pasta, cooked', ['pasta', 'spaghetti', 'penne', 'macaroni'], 'cooked', '1 cup spaghetti not packed', True),
 ('bread-whole-wheat', 'Whole-wheat bread', ['whole wheat bread', 'wholemeal bread'], 'as_sold', '1 slice', False),
 ('bread-white', 'White bread', ['bread', 'white bread', 'toast'], 'as_sold', '1 slice', False),
 ('potato-baked', 'Potato, baked', ['potato'], 'cooked', '1 potato medium', False),
 ('broccoli-boiled', 'Broccoli, boiled', ['broccoli'], 'cooked', '0.5 cup, chopped', False),
 ('peas-green-cooked', 'Green peas, cooked', ['green pea', 'pea'], 'cooked', '0.5 cup', False),
]
PLANT = ['almond', 'oat', 'soy', 'soya', 'rice', 'coconut', 'cashew', 'hemp', 'pea', 'plant', 'vegan', 'dairy-free']
EXCLUDE = {
 'chicken-breast-roasted': ['nugget', 'breaded', 'tender', 'katsu', 'schnitzel', 'battered', 'popcorn'],
 'chicken-thigh-roasted': ['breaded', 'battered'],
 'salmon-atlantic-farmed-cooked': ['smoked', 'canned', 'roe'],
 'cod-atlantic-cooked': ['battered', 'breaded'],
 'tilapia-cooked': ['battered', 'breaded'],
 'shrimp-cooked': ['breaded', 'tempura', 'battered', 'popcorn'],
 'egg-hard-boiled': ['noodle', 'substitute', 'plant', 'eggplant', 'nog', 'roll'],
 'egg-scrambled': ['substitute', 'plant', 'tofu'],
 'egg-white-raw': ['substitute'],
 'greek-yogurt-nonfat': PLANT + ['frozen', 'whole', 'lowfat', 'low'],
 'yogurt-plain-whole': PLANT + ['frozen', 'greek', 'drink'],
 'cottage-cheese-2': [],
 'milk-2': PLANT + ['whole', 'skim', 'nonfat', 'chocolate', 'condensed', 'evaporated', 'powder', 'shake', 'coconut'],
 'milk-whole': PLANT + ['chocolate', 'condensed', 'evaporated', 'powder'],
 'milk-skim': PLANT + ['chocolate', 'powder'],
 'almonds': ['milk', 'butter', 'flour', 'yogurt'],
 'peanut-butter': ['cookie', 'cup', 'sandwich'],
 'ham-deli': ['hamburger', 'burger', 'steak'],
 'bacon': ['turkey', 'bit', 'vegan'],
 'rice-white-cooked': ['milk', 'cake', 'cracker', 'noodle', 'fried', 'brown', 'pudding', 'krispie'],
 'pasta-cooked': ['salad', 'sauce'],
 'bread-white': ['whole', 'wheat', 'wholemeal', 'french', 'garlic', 'banana', 'pita', 'naan', 'stick', 'crumb'],
 'potato-baked': ['chip', 'crisp', 'fries', 'fry', 'sweet', 'mashed', 'salad', 'hash'],
 'peas-green-cooked': ['chickpea', 'snow', 'snap', 'protein', 'soup', 'split'],
 'tuna-light-canned-water': ['oil', 'salad', 'steak', 'sushi'],
 'hummus': [],
 'oatmeal-cooked': ['cookie', 'bar'],
 'cheddar': ['cracker', 'sauce'],
 'mozzarella-part-skim': ['stick', 'fried'],
 'tofu-firm': ['silken', 'fried', 'skin'],
 'lentils-boiled': ['soup', 'pasta', 'chip'],
 'chickpeas-boiled': ['pasta', 'flour', 'roasted'],
 'black-beans-boiled': ['soup', 'pasta', 'refried'],
 'kidney-beans-boiled': ['chili'],
 'ground-beef-85-browned': ['lean', 'raw'],
}
def r1(x): return round(x * 10) / 10
def fmt_num(x):
    s = ('%.2f' % x).rstrip('0').rstrip('.')
    return s
lines = []
for key, name, aliases, state, plabel, use_yield in CHOICES:
    r = rows[key]
    m = r['per100g']
    assert r['description'] and m and all(m.get(k) is not None for k in ('protein', 'kcal', 'carbs', 'fat')), key
    portion = next((p for p in r['portions'] if p['label'] == plabel), None)
    assert portion, (key, plabel, r['portions'])
    y = r.get('derivedYield') if use_yield else None
    if use_yield: assert y and 0.5 < y < 3.5, (key, y)
    label = plabel.replace('0.5 ', '½ ').replace('0.25 ', '¼ ').replace('0.33 ', '⅓ ')
    parts = [
        f"key: '{key}'",
        f"name: '{name}'",
        f"aliases: [{', '.join(repr(a) for a in aliases)}]",
        f"state: '{state}'",
        f"per100g: {{ proteinG: {fmt_num(m['protein'])}, calories: {round(m['kcal'])}, carbsG: {fmt_num(m['carbs'])}, fatG: {fmt_num(m['fat'])} }}",
        f"fdcId: {r['fdc']}",
    ]
    if y: parts.append(f"cookedYield: {y}")
    parts.append(f"typicalPortion: {{ label: '{label}', grams: {fmt_num(portion['grams'])} }}")
    if EXCLUDE.get(key): parts.append(f"exclude: [{', '.join(repr(w) for w in EXCLUDE[key])}]")
    lines.append(f"  // {r['description']}\n  {{ {', '.join(parts)} }},")
header = '''/**
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
'''
open(sys.argv[2], 'w').write(header + '\n'.join(lines) + '\n];\n')
print(len(lines), 'rows')
