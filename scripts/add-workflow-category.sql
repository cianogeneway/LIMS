-- Add Category column to ExtractionWorklists table
ALTER TABLE "ExtractionWorklists" 
ADD COLUMN IF NOT EXISTS "Category" text DEFAULT 'DNA_EXTRACTION';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS "idx_extraction_worklists_category" ON "ExtractionWorklists"("Category");

-- Update existing records to have DNA_EXTRACTION category
UPDATE "ExtractionWorklists" 
SET "Category" = 'DNA_EXTRACTION' 
WHERE "Category" IS NULL;
