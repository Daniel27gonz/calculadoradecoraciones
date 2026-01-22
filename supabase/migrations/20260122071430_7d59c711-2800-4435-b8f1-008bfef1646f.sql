-- Add events_per_month column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS events_per_month integer DEFAULT 4;