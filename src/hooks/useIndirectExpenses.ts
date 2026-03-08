import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface IndirectExpenseRow {
  monthly_amount: number;
  payment_date: string | null;
}

export function useIndirectExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<IndirectExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('indirect_expenses')
        .select('monthly_amount, payment_date')
        .eq('user_id', user.id);

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error loading indirect expenses:', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Calculate total from the latest month that has expenses, excluding current month
  const getLatestMonthTotal = useCallback(() => {
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth() + 1;

    const withDates = expenses.filter(e => {
      if (!e.payment_date) return false;
      const [y, m] = e.payment_date.split('-');
      return !(parseInt(y) === currentY && parseInt(m) === currentM);
    });

    if (withDates.length === 0) return 0;

    let latestY = 0, latestM = 0;
    withDates.forEach(e => {
      const [y, m] = e.payment_date!.split('-');
      const yr = parseInt(y), mo = parseInt(m);
      if (yr > latestY || (yr === latestY && mo > latestM)) {
        latestY = yr;
        latestM = mo;
      }
    });

    return withDates
      .filter(e => {
        const [y, m] = e.payment_date!.split('-');
        return parseInt(y) === latestY && parseInt(m) === latestM;
      })
      .reduce((sum, e) => sum + (Number(e.monthly_amount) || 0), 0);
  }, [expenses]);

  return { expenses, loading, getLatestMonthTotal, reload: loadExpenses };
}
