# ONE COMMAND TO IMPORT EVERYTHING
# Usage: .\import-instruments.ps1 "C:\path\to\your\file.xlsx"

param(
    [Parameter(Mandatory=$true)]
    [string]$ExcelFile
)

Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host ("=" * 59) -ForegroundColor Green
Write-Host " IMPORTING INSTRUMENTS DIRECTLY TO DATABASE " -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Green
Write-Host ("=" * 59) -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $ExcelFile)) {
    Write-Host "ERROR: File not found: $ExcelFile" -ForegroundColor Red
    exit 1
}

Write-Host "File: $ExcelFile" -ForegroundColor Yellow
Write-Host ""

# Run the import script
npx tsx scripts/import-directly.ts $ExcelFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
    Write-Host " DONE! View instruments at: http://localhost:3000/instruments " -ForegroundColor Green
    Write-Host "=" -NoNewline -ForegroundColor Green
    Write-Host ("=" * 59) -ForegroundColor Green
}



