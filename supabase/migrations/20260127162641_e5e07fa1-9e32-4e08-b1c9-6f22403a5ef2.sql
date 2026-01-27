-- Add design configuration columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS design_deposit_percentage numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS design_deposit_message text DEFAULT '',
ADD COLUMN IF NOT EXISTS design_additional_notes text DEFAULT '';