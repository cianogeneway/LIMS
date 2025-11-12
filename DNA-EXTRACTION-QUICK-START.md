# DNA Extraction WorkList - Quick Start Guide

## 🚀 Getting Started

The DNA Extraction WorkList system is now fully integrated into your LIMS application. Here's how to use it.

## 📍 Accessing the System

1. **Open your LIMS dashboard**
   - URL: `http://localhost:3000` (or your deployed URL)
   - Login with your credentials

2. **Navigate to DNA Extraction**
   - Look for the **"DNA Extraction"** menu item in the left sidebar
   - Click it to see all worklists

## 📝 Creating a New Worklist

### Step 1: Click "New Worklist"
- From the DNA Extraction list page, click the blue **"New Worklist"** button
- Or click "Create the first worklist" if no worklists exist yet

### Step 2: Fill in the Metadata Form

**Basic Information:**
- **Worklist Name** - Default: "DNA Extraction Worklist" (customize as needed)
- **Date** - Select the extraction date (defaults to today)
- **Performed By** - Enter technician name

**Extraction Kit Information:**
- **Kit Lot** - Enter kit lot number (e.g., "KIT-2024-001")
- **Kit Expiry Date** - Select expiry date
- **Extraction Kit Lot (Reference)** - Optional reference lot

**Qubit Mix Configuration:**
- **Qubit Mix X1** - Default: 1 µL
- **Qubit Mix Xn4** - Default: 4 µL
- **Qubit Reagent** - Default: 1 µL
- **Qubit Buffer** - Default: 199 µL

**Additional Information:**
- **Aliquote Information** - Instructions for sample preparation
- **Standards Information** - Standards setup info

### Step 3: Click "Create Worklist"
- System creates worklist with 32 empty sample rows
- Automatically redirects to detail page

## ✏️ Entering Sample Data

### Navigate to 32-Sample Grid
1. Open worklist from list
2. Click the **"32-Sample Grid"** tab
3. See all 32 wells (rows) ready for data entry

### Enter Sample Information

For each well, you can enter:

**Sample Identifiers:**
- **Sample ID** - Unique sample identifier
- **Sample Name** - Display name
- **Sex** - M/F/Unknown
- **Sample Type** - BLOOD, SALIVA, TISSUE, etc.

**Measurement Data:**
- **NanoDrop (ng/µL)** - DNA concentration from NanoDrop
- **A260/230** - Spectrophotometry ratio
- **A260/280** - Spectrophotometry ratio
- **Gel** - Gel result (e.g., INTACT, DEGRADED)
- **Qubit (ng/µL)** - DNA concentration from Qubit
- **Dilution** - Dilution factor used

### Making Changes
- Click on any cell to edit
- Changes are tracked automatically
- "Save Changes" button appears when edits exist
- Click "Save Changes" to persist all changes to database

### Tips
- Skip wells you don't have samples for
- Use Tab key to move between cells
- All numeric fields support decimal values
- Fields can be left blank if not applicable

## 🔍 Searching & Filtering

### Search by Worklist Name
- Use the search box on the list page
- Type worklist name, kit lot, or technician name
- Results update in real-time

### Pagination
- Worklists displayed 10 per page
- Use navigation arrows to view more
- Search results respect pagination

## 👁️ Viewing Worklist Details

### Metadata Tab
- View worklist header information
- See creation timestamp and creator
- View kit configuration details

### 32-Sample Grid Tab
- See all 32 wells with entered data
- Edit any well at any time
- Horizontally scrollable for all measurement columns

## 🗑️ Deleting a Worklist

1. From the list view, find the worklist
2. Click the red **"Delete"** button
3. Confirm deletion when prompted
4. Worklist and all associated data removed

## 💾 Data Persistence

- All changes are automatically saved to PostgreSQL database
- Timestamps tracked for audit trail
- User email recorded as modifier

## 📊 Worklist Status

Three status levels available:
- **DRAFT** - New worklist, not started (gray badge)
- **IN_PROGRESS** - Extraction in progress (blue badge)
- **COMPLETED** - Extraction finished (green badge)

Status can be changed by editing the worklist.

## 🔐 Permissions

- Users must be logged in to access
- All worklists visible to authenticated users
- Timestamp audit trail shows who made changes

## ❓ Common Tasks

### Task: Import Sample Data from CSV
Not yet automated. Currently enter manually or via API.

### Task: Generate QC Report
QC results stored in database. Export feature coming soon.

### Task: Copy Previous Worklist
Not yet supported. Create new and manually enter data.

### Task: Batch Edit Multiple Samples
Edit 32 wells, click Save Once - all update together!

## 🆘 Troubleshooting

### "No worklists found"
- You haven't created any yet
- Click "New Worklist" to create first one

### Search not working
- Check spelling of search term
- Try searching by different field (name vs kit lot)

### Can't save changes
- Ensure all numeric fields have valid values
- Check network connection
- Look for error message for details

### Data not appearing
- Refresh the page (Ctrl+F5)
- Data should persist immediately
- Check browser console for errors

## 📱 Mobile Access

The system is responsive and works on:
- ✅ Desktop (optimal experience)
- ✅ Tablet (landscape orientation recommended)
- ⚠️ Mobile (grid may be narrow, recommend desktop for data entry)

## 🎯 Next Steps

1. **Create your first worklist** (5 minutes)
2. **Enter sample data** for your project
3. **Save and verify** the data appears
4. **Share worklist ID** with team members who need access

## 📞 Support

For issues or questions:
1. Check this quick-start guide
2. Review DNA-EXTRACTION-IMPLEMENTATION.md for technical details
3. Check browser console for error messages (F12 → Console)
4. Contact your LIMS administrator

---

**Version:** 1.0
**Last Updated:** December 2024
**Status:** Ready for Production Use
