import geopandas as gpd

print("\n--- GeoJSON Data ---")
sulsel_gdf = gpd.read_file("frontend-desa-monitoring/public/data/sulsel_desa.geojson")
print(sulsel_gdf.columns)
if 'KDEPUM' in sulsel_gdf.columns:
    print(sulsel_gdf[['WADMKK', 'WADMKC', 'NAMOBJ', 'KDEPUM']].head(3))
if 'KDPPUM' in sulsel_gdf.columns:
    print(sulsel_gdf[['KDPPUM', 'KDPKAB', 'KDPKEC', 'KDPDES']].head(3))
