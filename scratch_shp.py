import geopandas as gpd

print("Reading shapefile with pyogrio...")
try:
    gdf = gpd.read_file('BATAS WILAYAH KELURAHAN-DESA 10K/Batas_Wilayah_KelurahanDesa_10K_AR.shp', engine='pyogrio', columns=['WADMPR', 'WADMKK', 'WADMKC', 'NAMOBJ', 'KDEPUM'])
    sulsel = gdf[gdf['WADMPR'] == 'Sulawesi Selatan']
    print("Total features in Sulsel:", len(sulsel))
    sulsel['centroid'] = sulsel.geometry.centroid
    print(sulsel.head())
except Exception as e:
    print("Error:", e)
