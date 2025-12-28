-- Add transport_items column to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS transport_items jsonb DEFAULT '[]'::jsonb;