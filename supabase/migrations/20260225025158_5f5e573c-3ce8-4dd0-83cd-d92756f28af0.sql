ALTER TABLE public.quotes ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Update existing quotes to 'pending'
UPDATE public.quotes SET status = 'pending' WHERE status IS NULL;