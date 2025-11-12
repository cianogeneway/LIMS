# PowerShell script to convert Excel/CSV to JSON for instruments import
# Usage: .\scripts\convert-spreadsheet.ps1 -InputFile "path\to\file.xlsx"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "data\instruments-import.json"
)

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "Instruments Import - Spreadsheet Converter" -ForegroundColor Cyan
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $InputFile)) {
    Write-Host "Error: File not found: $InputFile" -ForegroundColor Red
    exit 1
}

Write-Host "Input file: $InputFile" -ForegroundColor Yellow
Write-Host "Output file: $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Check if Python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Python not found. Installing required packages..." -ForegroundColor Yellow
    Write-Host "Please install Python and run: pip install pandas openpyxl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or use the web interface at: http://localhost:3000/instruments/import" -ForegroundColor Green
    exit 1
}

# Create output directory
$outputDir = Split-Path -Parent $OutputFile
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Run Python conversion script
Write-Host "Converting spreadsheet to JSON..." -ForegroundColor Yellow

$pythonScript = @"
import json
import pandas as pd
import sys

excel_path = r'$InputFile'
output_path = r'$OutputFile'

try:
    df = pd.read_excel(excel_path)
    print(f'Found {len(df)} rows')
    print(f'Columns: {list(df.columns)}')
    
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
        for excel_col, json_key in column_mapping.items():
            if excel_col in df.columns:
                value = row[excel_col]
                if pd.isna(value):
                    continue
                if json_key in ['unitPrice2016_2018', 'unitPrice2019', 'unitPrice2023', 'insuranceReplacementValue']:
                    if isinstance(value, str):
                        value = value.replace('R', '').replace('$', '').replace(',', '').strip()
                    try:
                        instrument[json_key] = float(value) if value else None
                    except:
                        pass
                elif json_key in ['invoiceDate', 'serviceDueDate']:
                    if isinstance(value, pd.Timestamp):
                        instrument[json_key] = value.strftime('%Y-%m-%d')
                    elif isinstance(value, str):
                        instrument[json_key] = value
                else:
                    instrument[json_key] = str(value).strip() if value else None
        
        if 'serialNumber' not in instrument or not instrument['serialNumber']:
            print(f'Warning: Row {idx+1} missing serialNumber, skipping...')
            continue
        
        if 'productDescription' not in instrument or not instrument['productDescription']:
            if 'shortDescription' in instrument and instrument['shortDescription']:
                instrument['productDescription'] = instrument['shortDescription']
            else:
                instrument['productDescription'] = instrument.get('serialNumber', 'Unknown')
        
        instruments.append(instrument)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(instruments, f, indent=2, ensure_ascii=False)
    
    print(f'Successfully converted {len(instruments)} instruments')
    print(f'Saved to: {output_path}')
    
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
"@

$pythonScript | python

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
    Write-Host "Conversion Complete!" -ForegroundColor Green
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure your Next.js server is running" -ForegroundColor White
    Write-Host "2. Navigate to: http://localhost:3000/instruments/import" -ForegroundColor White
    Write-Host "3. Click 'Run Migration' (one-time)" -ForegroundColor White
    Write-Host "4. Upload the JSON file: $OutputFile" -ForegroundColor White
    Write-Host "5. Click 'Import Instruments'" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Conversion failed. Please check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use the web interface at:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3000/instruments/import" -ForegroundColor Cyan
    Write-Host ""
}


