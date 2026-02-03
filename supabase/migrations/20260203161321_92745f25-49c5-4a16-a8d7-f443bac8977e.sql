-- Add reusable_materials_used column to quotes table for tracking which reusable materials are used in each quote
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS reusable_materials_used JSONB DEFAULT '[]'::jsonb;