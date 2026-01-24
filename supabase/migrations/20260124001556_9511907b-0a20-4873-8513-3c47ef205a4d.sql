-- Add wastage_percentage column to quotes table
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS wastage_percentage integer DEFAULT 5;