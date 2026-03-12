CREATE POLICY "Users can update own purchases"
ON public.material_purchases
FOR UPDATE
USING (auth.uid() = user_id);