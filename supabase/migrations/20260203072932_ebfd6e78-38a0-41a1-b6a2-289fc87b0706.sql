-- Add furniture_items column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS furniture_items JSONB DEFAULT '[]'::jsonb;