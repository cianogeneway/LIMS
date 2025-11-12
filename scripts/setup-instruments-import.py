#!/usr/bin/env python3
"""
Complete setup script for importing instruments from asset register
This script will:
1. Check/run database migration
2. Convert Excel/CSV to JSON
3. Import the data
"""

import json
import sys
import os
import requests
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Installing pandas...")
    os.system("pip install pandas openpyxl")
    import pandas as pd

# Configuration
API_BASE_URL = "http://localhost:3000"
SESSION_TOKEN = None  # Will need to be set if using API

def convert_excel_to_json(excel_path, output_path="data/instruments-import.json"):
    """Convert Excel file to JSON format"""
    print(f"Reading Excel file: {excel_path}")
    
    # Read Excel file
    df = pd.read_excel(excel_path)
    
    print(f"Found {len(df)} rows")
    print(f"Columns: {', '.join(df.columns.tolist())}")
    
    # Map common column names to our JSON structure
    column_mapping = {
        'Supplier': 'supplier',
        'Company / Manufacture': 'manufacturer',
        'Manufacturer': 'manufacturer',
        'Invoice Date': 'invoiceDate',
        'Invoice Number': 'invoiceNumber',
        'Serial Number': 'serialNumber',
        'Product Description': 'productDescription',
        'Short Description': 'shortDescription',
        'Area of use': 'areaOfUse',
        'Area of Use': 'areaOfUse',
        'Company / Mnfrct Product Code': 'productCode',
        'Product Code': 'productCode',
        'Single Unit Price (excl VAT) 2016 - 2018': 'unitPrice2016_2018',
        'Single Unit Price (excl VAT) 2019': 'unitPrice2019',
        'Single Unit Price (excl VAT) 2023': 'unitPrice2023',
        'Insurance purposes (Replacement value)': 'insuranceReplacementValue',
        'Type of Maintenance/Service': 'maintenanceType',
        'Service Due Date': 'serviceDueDate',
        'Smallest Single unit measurements for cost calculations': 'unitMeasurement',
    }
    
    instruments = []
    for idx, row in df.iterrows():
        instrument = {}
        
        # Map columns
        for excel_col, json_key in column_mapping.items():
            if excel_col in df.columns:
                value = row[excel_col]
                # Handle NaN values
                if pd.isna(value):
                    continue
                # Convert to appropriate type
                if json_key in ['unitPrice2016_2018', 'unitPrice2019', 'unitPrice2023', 'insuranceReplacementValue']:
                    # Remove currency symbols and convert to float
                    if isinstance(value, str):
                        value = value.replace('R', '').replace('$', '').replace(',', '').strip()
                    try:
                        instrument[json_key] = float(value) if value else None
                    except:
                        pass
                elif json_key in ['invoiceDate', 'serviceDueDate']:
                    # Convert date to string
                    if isinstance(value, pd.Timestamp):
                        instrument[json_key] = value.strftime('%Y-%m-%d')
                    elif isinstance(value, str):
                        instrument[json_key] = value
                else:
                    instrument[json_key] = str(value).strip() if value else None
        
        # Ensure required fields
        if 'serialNumber' not in instrument or not instrument['serialNumber']:
            print(f"Warning: Row {idx+1} missing serialNumber, skipping...")
            continue
        
        if 'productDescription' not in instrument or not instrument['productDescription']:
            # Use shortDescription if available
            if 'shortDescription' in instrument and instrument['shortDescription']:
                instrument['productDescription'] = instrument['shortDescription']
            else:
                print(f"Warning: Row {idx+1} missing productDescription, using serialNumber...")
                instrument['productDescription'] = instrument['serialNumber']
        
        instruments.append(instrument)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Save JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(instruments, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Converted {len(instruments)} instruments to JSON")
    print(f"✓ Saved to: {output_path}")
    
    return output_path

def main():
    print("=" * 60)
    print("Instruments Import Setup")
    print("=" * 60)
    
    # Check for Excel/CSV file
    excel_files = list(Path('.').glob('*.xlsx')) + list(Path('.').glob('*.xls')) + list(Path('.').glob('*.csv'))
    
    if not excel_files:
        print("\nNo Excel/CSV file found in current directory.")
        print("Please provide the path to your asset register file:")
        file_path = input("File path: ").strip().strip('"')
        if not os.path.exists(file_path):
            print(f"Error: File not found: {file_path}")
            return
    else:
        print(f"\nFound {len(excel_files)} file(s):")
        for i, f in enumerate(excel_files, 1):
            print(f"  {i}. {f}")
        
        if len(excel_files) == 1:
            file_path = str(excel_files[0])
            print(f"\nUsing: {file_path}")
        else:
            choice = input(f"\nSelect file (1-{len(excel_files)}): ").strip()
            file_path = str(excel_files[int(choice) - 1])
    
    # Convert to JSON
    json_path = convert_excel_to_json(file_path)
    
    print("\n" + "=" * 60)
    print("Next Steps:")
    print("=" * 60)
    print("1. Make sure your Next.js server is running (npm run dev)")
    print("2. Navigate to: http://localhost:3000/instruments/import")
    print("3. Click 'Run Migration' (one-time)")
    print("4. Click 'Select JSON File' and choose:")
    print(f"   {os.path.abspath(json_path)}")
    print("5. Click 'Import Instruments'")
    print("\nOr use the API directly:")
    print(f"   curl -X POST http://localhost:3000/api/instruments/import \\")
    print(f"     -H 'Content-Type: application/json' \\")
    print(f"     -d @{json_path}")

if __name__ == "__main__":
    main()


