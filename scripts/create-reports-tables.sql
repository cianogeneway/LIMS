-- Reports table
CREATE TABLE IF NOT EXISTS "Reports" (
  "Id" text PRIMARY KEY,
  "Name" text NOT NULL,
  "FileUrl" text NOT NULL,
  "UploadedBy" text NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL
);

-- QC Reports table
CREATE TABLE IF NOT EXISTS "QCReports" (
  "Id" text PRIMARY KEY,
  "Name" text NOT NULL,
  "Status" text NOT NULL CHECK ("Status" IN ('PASSED', 'FAILED')),
  "FileUrl" text NOT NULL,
  "UploadedBy" text NOT NULL,
  "CreatedAt" timestamp with time zone NOT NULL,
  "UpdatedAt" timestamp with time zone NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_reports_created_at" ON "Reports"("CreatedAt");
CREATE INDEX IF NOT EXISTS "idx_qc_reports_created_at" ON "QCReports"("CreatedAt");
CREATE INDEX IF NOT EXISTS "idx_qc_reports_status" ON "QCReports"("Status");
