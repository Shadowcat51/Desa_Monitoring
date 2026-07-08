import pandas as pd

try:
    df = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx', engine='openpyxl')
    print("Columns in Excel:")
    for col in df.columns:
        print(col)
except Exception as e:
    print(f"Failed with openpyxl: {e}")
    try:
        df = pd.read_excel('data_podes/73_Sulawesi Selatan IKG & ID 2024.xlsx')
        print("Columns in Excel (default engine):")
        for col in df.columns:
            print(col)
    except Exception as e2:
        print(f"Failed with default engine: {e2}")
