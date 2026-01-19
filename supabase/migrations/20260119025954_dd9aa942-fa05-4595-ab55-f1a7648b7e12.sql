-- Create enum for user approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create user_approval_status table (separate from profiles per security best practices)
CREATE TABLE public.user_approval_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    status approval_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_approval_status ENABLE ROW LEVEL SECURITY;

-- Users can only read their own approval status
CREATE POLICY "Users can view own approval status"
ON public.user_approval_status
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check approval status
CREATE OR REPLACE FUNCTION public.is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_approval_status
    WHERE user_id = _user_id
      AND status = 'approved'
  )
$$;

-- Create security definer function to get user status
CREATE OR REPLACE FUNCTION public.get_user_approval_status(_user_id uuid)
RETURNS approval_status
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status
  FROM public.user_approval_status
  WHERE user_id = _user_id
$$;

-- Create trigger to auto-create approval status on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_approval_status (user_id, status)
  VALUES (NEW.id, 'pending');
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_approval
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_approval();

-- Create trigger to update updated_at
CREATE TRIGGER update_user_approval_status_updated_at
  BEFORE UPDATE ON public.user_approval_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();