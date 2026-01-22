-- Add new columns to user_materials table for extended material information
ALTER TABLE public.user_materials
ADD COLUMN IF NOT EXISTS base_unit text DEFAULT 'unidad',
ADD COLUMN IF NOT EXISTS purchase_unit text DEFAULT 'paquete',
ADD COLUMN IF NOT EXISTS presentation_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_per_presentation numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS cost_per_unit numeric GENERATED ALWAYS AS (
  CASE 
    WHEN quantity_per_presentation > 0 THEN presentation_price / quantity_per_presentation
    ELSE 0
  END
) STORED;