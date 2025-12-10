# New Features Added to LIMS System

## 1. Quotation Generation System

### Database Tables Created
- **Quotations** - Main quotation records with status tracking
- **QuotationItems** - Line items for each quotation

### Features
- Generate professional quotations for clients
- Auto-generate quotation numbers (QUO-2025-0001 format)
- Line item management with quantity and pricing
- Automatic VAT calculation (15%)
- Multiple status tracking: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- Validity period management
- Notes and Terms & Conditions sections
- Currency support (defaults to ZAR)

### Pages Created
- `/quotations` - Main quotations management page
- Create quotations with client selection from existing clients
- View all quotations with filtering by status and client

### API Endpoints
- `GET /api/quotations` - List all quotations (with filters)
- `POST /api/quotations` - Create new quotation

---

## 2. Reference Ranges & Limits Capture Portal

### Database Table Created
- **ReferenceRanges** - Laboratory test reference ranges and limits

### Features
- Capture test limits and interpretations
- Support for multiple parameters per test
- Age group specific ranges (Adult, Pediatric, Infant, All)
- Gender-specific ranges (Male, Female, All)
- Normal range (Min/Max values)
- **Critical threshold alerts** (Critical Low/High)
- Clinical interpretations and notes
- Category organization (Hematology, Chemistry, Immunology, Genomics, Microbiology, Pathology)
- Active/Inactive status management

### Pages Created
- `/reference-ranges` - Reference ranges management portal
- Add/Edit/Delete reference ranges
- Filter by category
- Visual display of normal vs critical ranges

### API Endpoints
- `GET /api/reference-ranges` - List ranges (with filters)
- `POST /api/reference-ranges` - Create new range
- `DELETE /api/reference-ranges?id={id}` - Delete range

---

## 3. Report Templates System

### Database Table Created
- **ReportTemplates** - Customizable report templates

### Features
- Create custom report templates for different test types
- HTML-based templates with placeholder support ({{VARIABLE}})
- Template types supported:
  - Paternity Testing
  - Blood Profiling (with HbA1c and Lipogram variants)
  - Genomics
  - MicroArray (CytoScan, SCAT, GCAT variants)
  - NGS, Sanger Sequencing
  - HID, Immunology
- **Pre-built templates** for Paternity and Blood Profiling
- Customizable header, body, and footer sections
- Toggle options:
  - Include Reference Ranges
  - Include Interpretation
  - Include QC Metrics
- Default template designation
- Active/Inactive status

### Pages Created
- `/report-templates` - Template management portal
- Create/Edit/Delete templates
- Load pre-built templates with one click
- Filter by template type
- Visual template preview

### API Endpoints
- `GET /api/report-templates` - List templates (with filters)
- `POST /api/report-templates` - Create new template
- `DELETE /api/report-templates?id={id}` - Delete template

---

## Navigation Updates

Added to sidebar menu:
- **Quotations** (between Purchase Orders and Invoices)
- **Reference Ranges** (after QC Reports)
- **Report Templates** (after Reference Ranges)

---

## Database Migration

### To Create Tables
Run this command when connected to your database:
```bash
npx tsx scripts/run-create-quotations-and-templates.ts
```

### Migration Script Includes
- Quotations and QuotationItems tables
- ReferenceRanges table with indexes
- ReportTemplates table with indexes
- All necessary foreign key constraints
- Optimized indexes for performance

---

## Example Use Cases

### 1. Quotations
1. Client requests a quote for 50 DNA samples
2. Create quotation, select client (pricing auto-fills)
3. Add line items (e.g., "DNA Extraction - 50 samples @ R200 each")
4. System calculates subtotal, VAT, and total
5. Save as DRAFT, then mark as SENT when emailed
6. Update to ACCEPTED when client confirms

### 2. Reference Ranges
1. Blood test requires Hemoglobin reference
2. Create range: Test="Complete Blood Count", Parameter="Hemoglobin"
3. Set normal range: 12.0 - 16.0 g/dL (Female Adult)
4. Set critical thresholds: Low <7.0, High >18.0
5. Add interpretation: "Low levels may indicate anemia"
6. Reports can now auto-flag out-of-range results

### 3. Report Templates
1. Need custom paternity report
2. Click "Load Paternity Template" for pre-built starting point
3. Customize header with lab logo and contact info
4. Modify body template to include required sections
5. Add placeholders like {{CASE_NUMBER}}, {{PROBABILITY}}
6. Enable "Include QC Metrics" for run quality data
7. Set as default template for all paternity reports
8. When generating reports, select this template from dropdown

---

## Template Placeholder Examples

### Paternity Report Placeholders
- `{{CASE_NUMBER}}` - Unique case identifier
- `{{TEST_DATE}}` - Date of testing
- `{{FATHER_NAME}}` - Alleged father's name
- `{{MOTHER_NAME}}` - Mother's name
- `{{CHILD_NAME}}` - Child's name
- `{{MARKERS_TABLE}}` - Genetic markers data table
- `{{PROBABILITY}}` - Probability of paternity percentage
- `{{INTERPRETATION}}` - Results interpretation

### Blood Profile Placeholders
- `{{PATIENT_ID}}` - Patient identifier
- `{{PATIENT_NAME}}` - Patient name
- `{{DOB}}` - Date of birth
- `{{COLLECTION_DATE}}` - Sample collection date
- `{{RESULTS_TABLE}}` - Test results table
- `{{REFERENCE_RANGES}}` - Normal ranges table
- `{{INTERPRETATION}}` - Clinical interpretation
- `{{CRITICAL_VALUES}}` - Flagged critical results

---

## Files Created/Modified

### Database Scripts
- `scripts/create-quotations-and-templates.sql`
- `scripts/run-create-quotations-and-templates.ts`

### API Routes
- `app/api/quotations/route.ts`
- `app/api/reference-ranges/route.ts`
- `app/api/report-templates/route.ts`

### Frontend Pages
- `app/quotations/page.tsx`
- `app/reference-ranges/page.tsx`
- `app/report-templates/page.tsx`

### Navigation
- `components/layout/sidebar.tsx` (updated)

---

## Next Steps

1. **Run the migration** to create database tables
2. **Test quotation generation** with existing clients
3. **Populate reference ranges** for your common tests
4. **Create report templates** for each workflow type
5. **Integrate templates** with report generation workflow

Warm regards, Lifelane Healthcare
