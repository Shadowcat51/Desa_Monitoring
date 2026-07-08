import pandas as pd

df_2024 = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx')
print("--- 2024 Kategori Indeks Desa Unique Values ---")
print(df_2024['Kategori Indeks Desa'].value_counts())
print("\n--- 2024 Sample IKG vs Kategori ---")
print(df_2024[['IKG', 'Indeks Desa', 'Kategori Indeks Desa']].head(10))

df_2025 = pd.read_excel('data_podes/7300 [DRAFT IKG 2025].xlsx')
print("\n--- 2025 Sample IKG2025 ---")
print(df_2025[['IKG2025']].head(10))

print("\n--- Code formats ---")
print("2024 Code head:", df_2024['Code'].head(3).tolist())
print("2025 kode_desa head:", df_2025['kode_desa'].head(3).tolist())
