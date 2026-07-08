import pandas as pd
import geopandas as gpd

print("--- Excel Data ---")
df = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx', engine='calamine')
print(df.columns)
print(df[['Code', 'Nama Kabupaten', 'Nama Kecamatan', 'Nama Desa/Kelurahan']].head(3))

print("\n--- Shapefile Data ---")
shp = gpd.read_file('BATAS WILAYAH KELURAHAN-DESA 10K/SULSEL_DESA_2024.shp')
print(shp.columns)
print(shp[['WADMKK', 'WADMKC', 'NAMOBJ', 'KDPPUM', 'KDPKAB', 'KDPKEC', 'KDPDES', 'KDEPUM']].head(3))
