-- Add FileUrl column to SOPs table if it doesn't exist
ALTER TABLE "SOPs" 
ADD COLUMN IF NOT EXISTS "FileUrl" TEXT;

-- Add comment
COMMENT ON COLUMN "SOPs"."FileUrl" IS 'Azure Blob Storage URL for the uploaded SOP document';
