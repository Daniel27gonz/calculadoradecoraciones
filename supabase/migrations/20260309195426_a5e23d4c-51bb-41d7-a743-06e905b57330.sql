
CREATE OR REPLACE FUNCTION public.resync_all_transactions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted int;
  v_income int := 0;
  v_mat_expenses int := 0;
  v_indirect_expenses int := 0;
  rec RECORD;
BEGIN
  -- 1. Delete ALL existing transactions
  DELETE FROM public.transactions;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- 2. Re-insert income from quote_payments
  FOR rec IN
    SELECT qp.user_id, qp.amount, qp.payment_date, qp.is_paid, qp.quote_id,
           q.client_name, q.folio
    FROM public.quote_payments qp
    LEFT JOIN public.quotes q ON q.id = qp.quote_id
    WHERE qp.amount > 0
  LOOP
    INSERT INTO public.transactions (user_id, type, amount, description, category, transaction_date, reference_id)
    VALUES (
      rec.user_id,
      'income',
      rec.amount,
      CASE WHEN rec.is_paid THEN 'Pagos completos' ELSE 'Anticipos' END
        || ' - ' || COALESCE(rec.client_name, 'Cliente')
        || ' (Folio #' || COALESCE(rec.folio::text, '') || ')',
      CASE WHEN rec.is_paid THEN 'Pagos completos' ELSE 'Anticipos' END,
      rec.payment_date,
      rec.quote_id::text
    );
    v_income := v_income + 1;
  END LOOP;

  -- 3. Re-insert expenses from material_purchases
  FOR rec IN
    SELECT mp.id as purchase_id, mp.user_id, mp.total_paid, mp.purchase_date, um.name as material_name
    FROM public.material_purchases mp
    LEFT JOIN public.user_materials um ON um.id = mp.material_id
    WHERE mp.total_paid > 0
  LOOP
    INSERT INTO public.transactions (user_id, type, amount, description, category, transaction_date, reference_id)
    VALUES (
      rec.user_id,
      'expense',
      rec.total_paid,
      'Compra: ' || COALESCE(rec.material_name, 'Material'),
      'Materiales',
      rec.purchase_date,
      'purchase_' || rec.purchase_id::text
    );
    v_mat_expenses := v_mat_expenses + 1;
  END LOOP;

  -- 4. Re-insert expenses from indirect_expenses
  FOR rec IN
    SELECT ie.id as expense_id, ie.user_id, ie.monthly_amount, ie.payment_date, ie.description
    FROM public.indirect_expenses ie
    WHERE ie.monthly_amount > 0 AND ie.payment_date IS NOT NULL
  LOOP
    INSERT INTO public.transactions (user_id, type, amount, description, category, transaction_date, reference_id)
    VALUES (
      rec.user_id,
      'expense',
      rec.monthly_amount,
      'Gasto del mes: ' || COALESCE(rec.description, ''),
      'Gastos del mes',
      rec.payment_date,
      'indirect_expense_' || rec.expense_id::text
    );
    v_indirect_expenses := v_indirect_expenses + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'income_inserted', v_income,
    'material_expenses_inserted', v_mat_expenses,
    'indirect_expenses_inserted', v_indirect_expenses,
    'total_inserted', v_income + v_mat_expenses + v_indirect_expenses
  );
END;
$$;
