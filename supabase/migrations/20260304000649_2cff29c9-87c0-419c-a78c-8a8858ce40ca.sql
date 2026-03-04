
CREATE TABLE public.indirect_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  description text NOT NULL DEFAULT '',
  monthly_amount numeric NOT NULL DEFAULT 0,
  payment_date date,
  registered_in_finances boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.indirect_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own indirect expenses"
  ON public.indirect_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own indirect expenses"
  ON public.indirect_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own indirect expenses"
  ON public.indirect_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own indirect expenses"
  ON public.indirect_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
