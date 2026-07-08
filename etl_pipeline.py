import geopandas as gpd
import pandas as pd
import json
import os
import gc
import difflib
import re

def clean_name(s):
    s = str(s).upper()
    s = s.replace('KABUPATEN ', '').replace('KOTA ', '')
    s = s.replace(' DAN ', '')
    s = s.replace('LEMBANG ', '').replace('DESA ', '')
    return re.sub(r'[^A-Z0-9]', '', s)

def run_etl():
    print("Loading 2024 IKG Excel...")
    df_2024 = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx', engine='calamine')
    
    print("Loading 2025 PODES DBF (Village Attribute data)...")
    try:
        from dbfread import DBF
        dbf = DBF('data_podes/73_podes2025-desa-Gabung.dbf', load=True)
        df_dbf = pd.DataFrame(list(dbf))
    except Exception as e:
        print(f"Fallback to geopandas for DBF: {e}")
        df_dbf = gpd.read_file('data_podes/73_podes2025-desa-Gabung.dbf', engine='pyogrio')
    df_2025 = df_dbf
    
    print("Loading Pre-processed Shapefile (GeoJSON)...")
    sulsel_gdf = gpd.read_file("frontend-desa-monitoring/public/data/sulsel_desa.geojson")

    print("Merging Data...")
    # Normalize codes to strings
    # df_2024['Code'] keeps the dot format for exact matching
    df_2024['Code'] = df_2024['Code'].astype(str).str.strip()

    # Merging the two datasets (just 2024 for now, since 2025 is dropped)
    merged_data = df_2024

    sulsel_gdf = gpd.read_file('frontend-desa-monitoring/public/data/sulsel_desa.geojson')

    print("Computing Centroids...")
    sulsel_gdf['centroid_lon'] = sulsel_gdf.geometry.centroid.x
    sulsel_gdf['centroid_lat'] = sulsel_gdf.geometry.centroid.y

    print("Cleaning strings for matching...")
    sulsel_gdf['clean_kab'] = sulsel_gdf['WADMKK'].apply(clean_name)
    sulsel_gdf['clean_kec'] = sulsel_gdf['WADMKC'].apply(clean_name)
    sulsel_gdf['clean_desa'] = sulsel_gdf['NAMOBJ'].apply(clean_name)

    df_2024['clean_kab'] = df_2024['Nama Kabupaten'].apply(clean_name)
    df_2024['clean_kec'] = df_2024['Nama Kecamatan'].apply(clean_name)
    df_2024['clean_desa'] = df_2024['Nama Desa/Kelurahan'].apply(clean_name)
    
    df_2025['clean_kab'] = df_2025['NAMA_KAB'].apply(clean_name)
    df_2025['clean_kec'] = df_2025['NAMA_KEC'].apply(clean_name)
    df_2025['clean_desa'] = df_2025['NAMA_DESA'].apply(clean_name)

    # 1. Exact match by Kab + Kec + Desa
    m1 = pd.merge(sulsel_gdf, df_2024, on=['clean_kab', 'clean_kec', 'clean_desa'], how='inner')
    df_unmatched = df_2024[~df_2024['Code'].isin(m1['Code'])].copy()
    gdf_unmatched = sulsel_gdf[~sulsel_gdf['KDEPUM'].isin(m1['KDEPUM'])].copy()

    # 2. Exact match by Kab + Desa
    m2 = pd.merge(gdf_unmatched, df_unmatched, on=['clean_kab', 'clean_desa'], how='inner')
    df_unmatched = df_unmatched[~df_unmatched['Code'].isin(m2['Code'])].copy()
    gdf_unmatched = gdf_unmatched[~gdf_unmatched['KDEPUM'].isin(m2['KDEPUM'])].copy()

    # 3. Fuzzy match by Kab + Desa
    fuzzy_matches = []
    for idx, row in df_unmatched.iterrows():
        gdf_kab = gdf_unmatched[gdf_unmatched['clean_kab'] == row['clean_kab']]
        if not gdf_kab.empty:
            matches = difflib.get_close_matches(row['clean_desa'], gdf_kab['clean_desa'].tolist(), n=1, cutoff=0.6)
            if matches:
                match_gdf = gdf_kab[gdf_kab['clean_desa'] == matches[0]].iloc[0]
                fuzzy_dict = row.to_dict()
                fuzzy_dict['KDEPUM'] = match_gdf['KDEPUM']
                fuzzy_matches.append(fuzzy_dict)
                gdf_unmatched = gdf_unmatched[gdf_unmatched['KDEPUM'] != match_gdf['KDEPUM']]

    m3 = pd.DataFrame(fuzzy_matches) if fuzzy_matches else pd.DataFrame()
    matched_all = pd.concat([m1, m2, m3], ignore_index=True) if not m3.empty else pd.concat([m1, m2], ignore_index=True)

    # Merge 2024 data back to sulsel_gdf using left join to preserve all shapes
    data_cols = [c for c in df_2024.columns if c not in ['clean_kab', 'clean_kec', 'clean_desa']]
    matched_data_only = matched_all[['KDEPUM'] + data_cols]
    sulsel_gdf = pd.merge(sulsel_gdf, matched_data_only, on='KDEPUM', how='left')

    # Merge 2025 DBF Data based on clean_kab and clean_desa (just like we did for 2024)
    df_2025 = df_2025.drop_duplicates(subset=['clean_kab', 'clean_desa'])
    df_2025_subset = df_2025[['clean_kab', 'clean_desa', 'IDDESA']] # Take whatever column is useful, e.g. IDDESA or some R105 metric
    sulsel_gdf = pd.merge(sulsel_gdf, df_2025_subset, on=['clean_kab', 'clean_desa'], how='left')

    matched_count = sulsel_gdf['Code'].notna().sum()
    print(f"Total features after merge: {len(sulsel_gdf)}")
    print(f"Matched {matched_count} features successfully with 2024 data.")
    
    # Save to JSON
    storage_path = 'backend/storage/app/seed_data.geojson'
    os.makedirs(os.path.dirname(storage_path), exist_ok=True)
    sulsel_gdf.to_file(storage_path, driver='GeoJSON')
    print("ETL complete! Data is ready for Laravel Seeders.")

if __name__ == '__main__':
    run_etl()
