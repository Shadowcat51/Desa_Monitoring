from dbfread import DBF
import pandas as pd

try:
    dbf = DBF(r'd:\Magang\try_project\BATAS WILAYAH KELURAHAN-DESA 10K\Batas_Wilayah_KelurahanDesa_10K_AR.dbf', load=True)
    df = pd.DataFrame(list(dbf))
    print("Columns:", df.columns.tolist())
    print(df[['KDEPUM', 'KDPPUM', 'KDPKAB', 'KDPKEC', 'KDPDES', 'WADMKK', 'WADMKC', 'NAMOBJ']].head(3))
except Exception as e:
    print(e)
