
import pandas as pd
import os

STUDENT_FILE = "/home/baran/Dev/arkadasozelegitim/web/public/files/ogrencilistesi.xls"
PERSONNEL_FILE = "/home/baran/Dev/arkadasozelegitim/web/public/files/personellistesi.xls"

def inspect_file(path, label):
    print(f"--- Inspecting {label} ---")
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    try:
        # Try reading as standard Excel
        df = pd.read_excel(path, engine='xlrd')
        print("Format: standard XLS")
    except Exception as e:
        print(f"XLS read failed ({e}), trying HTML...")
        try:
            # Try reading as HTML table (common export format)
            dfs = pd.read_html(path)
            if dfs:
                df = dfs[0] # Assume first table is the data
                print("Format: HTML Table")
            else:
                print("No tables found in HTML.")
                return
        except Exception as e2:
            print(f"Error reading {path}: {e2}")
            return

    print(f"Columns: {list(df.columns)}")
    print("First 3 rows:")
    print(df.head(3).to_dict(orient='records'))

inspect_file(STUDENT_FILE, "STUDENT LIST")
print("\n")
inspect_file(PERSONNEL_FILE, "PERSONNEL LIST")
