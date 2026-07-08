import pandas as pd
import geopandas as gpd

print("--- 2024 IKG Excel ---")
df_2024 = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx', nrows=5)
print(df_2024.columns.tolist())

print("\n--- 2025 IKG Draft Excel ---")
df_2025 = pd.read_excel('data_podes/7300 [DRAFT IKG 2025].xlsx', nrows=5)
print(df_2025.columns.tolist())

print("\n--- 2025 PODES DBF ---")
gdf_dbf = gpd.read_file('data_podes/73_podes2025-desa-Gabung.dbf', rows=5, engine='pyogrio')
print(gdf_dbf.columns.tolist())
