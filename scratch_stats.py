import json

f = open('backend/storage/app/seed_data.geojson', encoding='utf-8')
data = json.load(f)

total = 0
in_excel = 0
kdebps_not_null = 0
fallback_kdepum = 0

for feat in data['features']:
    props = feat['properties']
    total += 1
    if props.get('Code'):
        in_excel += 1
    elif props.get('KDEBPS'):
        kdebps_not_null += 1
    else:
        fallback_kdepum += 1

print(f"Total: {total}, In Excel: {in_excel}, Has KDEBPS: {kdebps_not_null}, Fallback to KDEPUM: {fallback_kdepum}")
