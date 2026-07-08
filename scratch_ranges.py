import pandas as pd

df = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx', engine='openpyxl')
grouped = df.groupby('Kategori Indeks Desa')['Indeks Desa'].agg(['min', 'max']).reset_index()
print(grouped)
