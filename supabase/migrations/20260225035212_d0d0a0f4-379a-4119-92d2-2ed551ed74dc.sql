
-- Create table for tracking quote payments/deposits (anticipos)
CREATE TABLE public.quote_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own quote payments"
ON public.quote_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quote payments"
ON public.quote_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quote payments"
ON public.quote_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quote payments"
ON public.quote_payments FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookup by quote
CREATE INDEX idx_quote_payments_quote_id ON public.quote_payments(quote_id);
