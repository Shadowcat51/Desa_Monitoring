import pandas as pd
import json

df = pd.read_excel('d:\\Magang\\try_project\\data_podes\\73_Sulawesi Selatan IKG & ID 2024.xlsx')
df_bone = df[df['Nama Kabupaten'] == 'BONE'].head(5)

with open("d:/Magang/try_project/frontend-desa-monitoring/public/data/sulsel_desa.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

for _, row in df_bone.iterrows():
    nama = row['Nama Desa/Kelurahan'].upper()
    print(f"Excel: {nama} -> Code: {row['Code']}, Kec: {row['Kode Kecamatan']}, Desa: {row['Kode Desa/Kelurahan']}")
    for feature in data['features']:
        if feature['properties']['NAMOBJ'].upper() == nama and feature['properties']['WADMKK'].upper() == 'BONE':
            print(f"  Shapefile: KDEPUM: {feature['properties']['KDEPUM']}")
