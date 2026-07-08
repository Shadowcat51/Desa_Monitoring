import geopandas as gpd
import os

print("Loading shapefile...")
try:
    gdf = gpd.read_file("BATAS WILAYAH KELURAHAN-DESA 10K/Batas_Wilayah_KelurahanDesa_10K_AR.shp", engine="pyogrio")
    
    print("Filtering for Sulawesi Selatan in WADMPR...")
    sulsel_gdf = gdf[gdf['WADMPR'].str.strip().str.upper() == 'SULAWESI SELATAN']
    print(f"Found {len(sulsel_gdf)} rows for Sulawesi Selatan.")
    
    if len(sulsel_gdf) > 0:
        if sulsel_gdf.crs and sulsel_gdf.crs.to_epsg() != 4326:
            print("Converting to EPSG:4326...")
            sulsel_gdf = sulsel_gdf.to_crs(epsg=4326)
            
        print("Menerapkan kompresi sangat ringan (10 meter)...")
        # Kompresi sangat ringan agar bentuk poligon tetap sangat detail
        # tapi ukurannya turun dari 100MB menjadi ~20MB agar browser tidak freeze.
        sulsel_gdf['geometry'] = sulsel_gdf['geometry'].simplify(tolerance=0.0001, preserve_topology=True)
            
        out_path = "frontend-desa-monitoring/public/data/sulsel_desa.geojson"
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        
        print(f"Saving to {out_path}...")
        sulsel_gdf.to_file(out_path, driver="GeoJSON")
        print("Done!")
    else:
        print("Error: No data found.")

except Exception as e:
    print(f"Error: {e}")
