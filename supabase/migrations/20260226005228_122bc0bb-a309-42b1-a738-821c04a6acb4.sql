
-- Add stock fields to user_materials
ALTER TABLE public.user_materials 
ADD COLUMN IF NOT EXISTS stock_current numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_minimum numeric NOT NULL DEFAULT 0;

-- Create material_purchases table
CREATE TABLE public.material_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.user_materials(id) ON DELETE CASCADE,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  provider text,
  quantity_presentations numeric NOT NULL DEFAULT 1,
  units_added numeric NOT NULL DEFAULT 0,
  total_paid numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;

-- RLS policies for material_purchases
CREATE POLICY "Users can view own purchases"
ON public.material_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
ON public.material_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own purchases"
ON public.material_purchases FOR DELETE
USING (auth.uid() = user_id);

-- Create stock_deductions table to track deductions from approved quotes
CREATE TABLE public.stock_deductions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.user_materials(id) ON DELETE CASCADE,
  quantity_deducted numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(quote_id, material_id)
);

ALTER TABLE public.stock_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deductions"
ON public.stock_deductions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deductions"
ON public.stock_deductions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deductions"
ON public.stock_deductions FOR DELETE
USING (auth.uid() = user_id);
