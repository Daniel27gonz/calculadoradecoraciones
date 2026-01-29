-- Add email column to profiles table for account recovery matching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create a function to restore orphaned data to a new user
CREATE OR REPLACE FUNCTION public.restore_orphaned_user_data(
  p_new_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_user_ids uuid[];
  v_restored_counts jsonb := '{}'::jsonb;
  v_quotes_count int := 0;
  v_materials_count int := 0;
  v_transactions_count int := 0;
  v_packages_count int := 0;
  v_old_profile_id uuid;
  v_old_profile profiles%ROWTYPE;
BEGIN
  -- Find old user_ids from profiles with matching email that don't belong to current user
  SELECT ARRAY_AGG(user_id) INTO v_old_user_ids
  FROM public.profiles
  WHERE email = p_email
    AND user_id != p_new_user_id;

  -- If no orphaned accounts found, return empty result
  IF v_old_user_ids IS NULL OR array_length(v_old_user_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('restored', false, 'message', 'No orphaned data found');
  END IF;

  -- Get the most recent old profile for data restoration
  SELECT * INTO v_old_profile
  FROM public.profiles
  WHERE user_id = ANY(v_old_user_ids)
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Update the new user's profile with old profile data (preserve important settings)
  IF v_old_profile.id IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      business_name = COALESCE(business_name, v_old_profile.business_name),
      logo_url = COALESCE(logo_url, v_old_profile.logo_url),
      currency = COALESCE(v_old_profile.currency, currency),
      default_hourly_rate = COALESCE(v_old_profile.default_hourly_rate, default_hourly_rate),
      mode = COALESCE(v_old_profile.mode, mode),
      events_per_month = COALESCE(v_old_profile.events_per_month, events_per_month),
      design_deposit_percentage = COALESCE(v_old_profile.design_deposit_percentage, design_deposit_percentage),
      design_deposit_message = COALESCE(v_old_profile.design_deposit_message, design_deposit_message),
      design_additional_notes = COALESCE(v_old_profile.design_additional_notes, design_additional_notes)
    WHERE user_id = p_new_user_id;
  END IF;

  -- Reassign quotes to new user
  UPDATE public.quotes
  SET user_id = p_new_user_id
  WHERE user_id = ANY(v_old_user_ids);
  GET DIAGNOSTICS v_quotes_count = ROW_COUNT;

  -- Reassign user_materials to new user
  UPDATE public.user_materials
  SET user_id = p_new_user_id
  WHERE user_id = ANY(v_old_user_ids);
  GET DIAGNOSTICS v_materials_count = ROW_COUNT;

  -- Reassign transactions to new user
  UPDATE public.transactions
  SET user_id = p_new_user_id
  WHERE user_id = ANY(v_old_user_ids);
  GET DIAGNOSTICS v_transactions_count = ROW_COUNT;

  -- Reassign packages to new user (non-default only)
  UPDATE public.packages
  SET user_id = p_new_user_id
  WHERE user_id = ANY(v_old_user_ids)
    AND is_default = false;
  GET DIAGNOSTICS v_packages_count = ROW_COUNT;

  -- Delete old orphaned profiles (data has been migrated)
  DELETE FROM public.profiles
  WHERE user_id = ANY(v_old_user_ids);

  -- Delete old orphaned approval statuses
  DELETE FROM public.user_approval_status
  WHERE user_id = ANY(v_old_user_ids);

  -- Build result
  v_restored_counts := jsonb_build_object(
    'restored', true,
    'quotes', v_quotes_count,
    'materials', v_materials_count,
    'transactions', v_transactions_count,
    'packages', v_packages_count,
    'message', 'Data restored successfully'
  );

  RETURN v_restored_counts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.restore_orphaned_user_data(uuid, text) TO authenticated;

-- Update existing profiles to include email from auth.users (for future matching)
-- This needs service role, so we'll handle it in an edge function