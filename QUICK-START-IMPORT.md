# Quick Start - Instruments Import 🚀

## Easiest Method: Web Interface

1. **Start your server** (if not running):
   ```bash
   npm run dev
   ```

2. **Open browser**: http://localhost:3000/instruments/import

3. **Click "Run Migration"** (one-time setup)

4. **Convert your spreadsheet to JSON**:
   - **Option A**: Use Python script
     ```bash
     python scripts/setup-instruments-import.py
     ```
   - **Option B**: Use PowerShell script (Windows)
     ```powershell
     .\scripts\convert-spreadsheet.ps1 -InputFile "path\to\your\file.xlsx"
     ```
   - **Option C**: Manual conversion
     - Export Excel to CSV
     - Use online converter: https://csvjson.com/csv2json
     - Map columns according to template

5. **Upload and Import**:
   - Click "Select JSON File"
   - Choose your `data/instruments-import.json` file
   - Click "Import Instruments"

6. **Done!** View your instruments at http://localhost:3000/instruments

---

## Automated Method (If you have Python)

```bash
# 1. Convert spreadsheet to JSON
python scripts/setup-instruments-import.py

# 2. The script will guide you through the rest
```

---

## Manual Method

1. **Run Migration** (one-time):
   - Go to http://localhost:3000/instruments/import
   - Click "Run Migration"

2. **Convert Spreadsheet**:
   - Export to CSV
   - Convert to JSON (see template in `data/instruments-import-template.json`)
   - Save as `data/instruments-import.json`

3. **Import**:
   - Use the web interface at `/instruments/import`
   - Or use the API directly

---

## Required JSON Format

```json
[
  {
    "serialNumber": "72211501612",
    "productDescription": "Eppendorf Research Plus Pipette",
    "shortDescription": "Pipette",
    "supplier": "AEC Amersham",
    "manufacturer": "Thermo Scientific",
    "areaOfUse": "Extraction Room",
    "maintenanceType": "Annual Service"
  }
]
```

**Only `serialNumber` and `productDescription` are required!**

---

## Need Help?

- See `README-INSTRUMENTS-IMPORT.md` for detailed instructions
- See `INSTRUMENTS-IMPORT-COMPLETE.md` for complete feature list
- Check the web interface at `/instruments/import` for step-by-step guidance



