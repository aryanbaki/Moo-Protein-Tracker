"""Builds the reference table from USDA SR Legacy CSVs. Args: <data dir> <spec json> <out json>."""
import csv, json, sys
d, spec_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
spec = json.load(open(spec_path))
want = set()
for s in spec:
    want.add(str(s['fdc'])); 
    if s.get('raw'): want.add(str(s['raw']))
    for a in s.get('alt', []): want.add(str(a))
foods = {r['fdc_id']: r['description'] for r in csv.DictReader(open(f'{d}/food.csv', newline='', encoding='utf-8')) if r['fdc_id'] in want}
nut = {}
IDS = {'1003': 'protein', '1008': 'kcal', '1005': 'carbs', '1004': 'fat', '1079': 'fiber'}
for r in csv.DictReader(open(f'{d}/food_nutrient.csv', newline='', encoding='utf-8')):
    if r['fdc_id'] in want and r['nutrient_id'] in IDS:
        nut.setdefault(r['fdc_id'], {})[IDS[r['nutrient_id']]] = float(r['amount'])
units = {r['id']: r['name'] for r in csv.DictReader(open(f'{d}/measure_unit.csv', newline='', encoding='utf-8'))}
portions = {}
for r in csv.DictReader(open(f'{d}/food_portion.csv', newline='', encoding='utf-8')):
    if r['fdc_id'] in want:
        unit = units.get(r['measure_unit_id'], '')
        label = ' '.join(x for x in [r['amount'], unit if unit != 'undetermined' else '', r['modifier'], r['portion_description']] if x).strip()
        portions.setdefault(r['fdc_id'], []).append({'label': label, 'grams': float(r['gram_weight'])})
out = []
for s in spec:
    f = str(s['fdc'])
    row = {'key': s['key'], 'fdc': int(f), 'description': foods.get(f), 'per100g': nut.get(f), 'portions': portions.get(f, [])}
    if s.get('raw'):
        rf = str(s['raw'])
        rp, cp = nut.get(rf, {}).get('protein'), nut.get(f, {}).get('protein')
        row['raw'] = {'fdc': int(rf), 'description': foods.get(rf), 'protein': rp}
        # Protein is conserved in cooking, so cooked weight / raw weight ≈ raw protein density / cooked density.
        row['derivedYield'] = round(rp / cp, 3) if rp and cp else None
    if s.get('alt'):
        # Other USDA records for the same food (e.g. salted vs no-salt tuna): their protein spread becomes a range.
        ps = [nut.get(f, {}).get('protein')] + [nut.get(str(a), {}).get('protein') for a in s['alt']]
        row['alts'] = [{'fdc': a, 'description': foods.get(str(a)), 'protein': nut.get(str(a), {}).get('protein')} for a in s['alt']]
        row['proteinRange'] = [min(ps), max(ps)]
    out.append(row)
json.dump(out, open(out_path, 'w'), indent=1)
