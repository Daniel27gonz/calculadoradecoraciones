-- Add client_phone column to quotes table for storing client phone number
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS client_phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.quotes.client_phone IS 'Phone number of the client for the quote';