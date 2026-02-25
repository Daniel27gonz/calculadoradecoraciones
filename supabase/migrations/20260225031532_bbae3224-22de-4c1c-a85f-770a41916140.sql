
-- Add folio column to quotes
ALTER TABLE public.quotes ADD COLUMN folio integer;

-- Create function to auto-generate sequential folio per user
CREATE OR REPLACE FUNCTION public.generate_quote_folio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio IS NULL THEN
    SELECT COALESCE(MAX(folio), 0) + 1 INTO NEW.folio
    FROM public.quotes
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER set_quote_folio
BEFORE INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.generate_quote_folio();

-- Backfill existing quotes with sequential folios per user
WITH numbered AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
  FROM public.quotes
  WHERE folio IS NULL
)
UPDATE public.quotes q
SET folio = n.rn
FROM numbered n
WHERE q.id = n.id;
