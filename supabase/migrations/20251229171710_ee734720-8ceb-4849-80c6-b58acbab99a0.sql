-- Add tool_wear_percentage column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS tool_wear_percentage numeric DEFAULT 7;