import geopandas as gpd
dbf = gpd.read_file('data_podes/73_podes2025-desa-Gabung.dbf')
makassar = dbf[dbf['NAMA_KAB'].str.contains('MAKASSAR', na=False, case=False)]
print("Total Makassar in DBF:", len(makassar))
if len(makassar) > 0:
    print(makassar.head())
