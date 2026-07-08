import pandas as pd

file_path = r'd:\Magang\try_project\data_podes\73_Sulawesi Selatan IKG & ID 2024.xlsx'
df = pd.read_excel(file_path)
print("Columns:", df.columns.tolist())
print(df[['Code', 'Provinsi', 'Kabupaten/Kota', 'Kecamatan', 'Desa/Kelurahan']].head(10))
