import geopandas as gpd

df = gpd.read_file('d:/Magang/try_project/BATAS WILAYAH KELURAHAN-DESA 10K/Batas_Wilayah_KelurahanDesa_10K_AR.shp', ignore_geometry=True)
sailus = df[df['NAMOBJ'].str.upper() == 'SAILUS']
print(sailus[['NAMOBJ', 'KDEPUM', 'KDEBPS']])
