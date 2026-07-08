import geopandas as gpd

gdf = gpd.read_file("d:/Magang/try_project/frontend-desa-monitoring/public/data/sulsel_desa.geojson")
print(gdf[['KDEPUM', 'KDPPUM', 'KDPKAB', 'KDPKEC', 'KDPDES', 'WADMKK', 'WADMKC', 'NAMOBJ']].head(10))
