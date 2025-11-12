-- DNA Extraction WorkList Schema
-- Supports "32 Format" worklists for DNA extraction QC tracking

CREATE TABLE IF NOT EXISTS "ExtractionWorklists" (
  "Id" text PRIMARY KEY,
  "Name" text NOT NULL,
  "WorklistType" text NOT NULL DEFAULT 'AUTOMATED_DNA_EXTRACTION_32_FORMAT',
  "Status" text NOT NULL DEFAULT 'DRAFT',
  "Date" timestamp with time zone,
  "PerformedBy" text,
  "ExtractionKitLot" text,
  "QubitMixX1" integer,
  "QubitMixXn4" integer,
  "QubitReagent" integer,
  "QubitBuffer" integer,
  "KitLot" text,
  "KitExpiryDate" date,
  "AliquoteInfo" text,
  "StandardsInfo" text,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  "CreatedBy" text
);

CREATE TABLE IF NOT EXISTS "ExtractionWorklistRows" (
  "Id" text PRIMARY KEY,
  "WorklistId" text NOT NULL REFERENCES "ExtractionWorklists"("Id") ON DELETE CASCADE,
  "Well" integer NOT NULL,
  "SampleId" text,
  "SampleName" text,
  "Sex" text,
  "SampleType" text,
  "Comment" text,
  "TestRequested" text,
  "NanoDropNgUl" decimal(10, 2),
  "A260_230" decimal(10, 2),
  "A260_280" decimal(10, 2),
  "Gel" text,
  "QubitNgUl" decimal(10, 2),
  "DilutionFactor" decimal(10, 2),
  "GelDilution" text,
  "dH20Volume" decimal(10, 2),
  "LoadingDyeBuffer" decimal(10, 2),
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL,
  UNIQUE("WorklistId", "Well")
);

CREATE TABLE IF NOT EXISTS "ExtractionQCResults" (
  "Id" text PRIMARY KEY,
  "WorklistId" text NOT NULL REFERENCES "ExtractionWorklists"("Id") ON DELETE CASCADE,
  "RowId" text NOT NULL REFERENCES "ExtractionWorklistRows"("Id") ON DELETE CASCADE,
  "SampleId" text,
  "ExtractionType" text,
  "QCMethod" text,
  "Concentration" decimal(10, 2),
  "Ratio260_280" decimal(10, 2),
  "Ratio260_230" decimal(10, 2),
  "GelResult" text,
  "QubitConcentration" decimal(10, 2),
  "Passed" boolean,
  "Override" boolean,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_extraction_worklists_status" ON "ExtractionWorklists"("Status");
CREATE INDEX IF NOT EXISTS "idx_extraction_worklists_date" ON "ExtractionWorklists"("Date");
CREATE INDEX IF NOT EXISTS "idx_extraction_worklist_rows_worklist_id" ON "ExtractionWorklistRows"("WorklistId");
CREATE INDEX IF NOT EXISTS "idx_extraction_qc_results_worklist_id" ON "ExtractionQCResults"("WorklistId");
CREATE INDEX IF NOT EXISTS "idx_extraction_qc_results_sample_id" ON "ExtractionQCResults"("SampleId");
