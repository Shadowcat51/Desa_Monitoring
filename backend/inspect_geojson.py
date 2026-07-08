import json

with open("d:/Magang/try_project/frontend-desa-monitoring/public/data/sulsel_desa.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

for feature in data['features'][:10]:
    props = feature['properties']
    print({k: props.get(k) for k in ['KDEPUM', 'KDPPUM', 'KDPKAB', 'KDPKEC', 'KDPDES', 'WADMKK', 'WADMKC', 'NAMOBJ']})
