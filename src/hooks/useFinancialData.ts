import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  transaction_date: string;
  source: 'quote_payment' | 'material_purchase' | 'indirect_expense' | 'reusable_investment';
  /** Extra metadata for detailed breakdowns */
  clientName?: string;
  isPaid?: boolean;
  materialCategory?: string;
}

interface FinancialData {
  transactions: FinancialTransaction[];
  loading: boolean;
  reload: () => void;
}

export function useFinancialData(): FinancialData {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [paymentsRes, purchasesRes, expensesRes, reusablesRes] = await Promise.all([
        supabase
          .from('quote_payments')
          .select('id, quote_id, amount, payment_date, is_paid')
          .eq('user_id', user.id),
        supabase
          .from('material_purchases')
          .select('id, material_id, total_paid, purchase_date')
          .eq('user_id', user.id),
        supabase
          .from('indirect_expenses')
          .select('id, monthly_amount, payment_date, description')
          .eq('user_id', user.id),
        supabase
          .from('reusable_materials')
          .select('id, name, material_cost, purchase_date')
          .eq('user_id', user.id)
          .not('purchase_date', 'is', null),
      ]);

      const allTx: FinancialTransaction[] = [];

      // Income from quote_payments
      if (paymentsRes.data) {
        const quoteIds = [...new Set(paymentsRes.data.map(p => p.quote_id))];
        let quoteMap = new Map<string, { client_name: string; folio: number | null }>();
        if (quoteIds.length > 0) {
          const { data: quotes } = await supabase
            .from('quotes')
            .select('id, client_name, folio')
            .in('id', quoteIds);
          if (quotes) {
            quoteMap = new Map(quotes.map(q => [q.id, { client_name: q.client_name, folio: q.folio }]));
          }
        }

        for (const p of paymentsRes.data) {
          if (Number(p.amount) <= 0) continue;
          const q = quoteMap.get(p.quote_id);
          const label = p.is_paid ? 'Pagos completos' : 'Anticipos';
          allTx.push({
            id: `qp_${p.id}`,
            type: 'income',
            amount: Number(p.amount),
            description: `${label} - ${q?.client_name || 'Cliente'}${q?.folio ? ` (Folio #${q.folio})` : ''}`,
            category: label,
            transaction_date: p.payment_date,
            source: 'quote_payment',
            clientName: q?.client_name || 'Cliente',
            isPaid: p.is_paid,
          });
        }
      }

      // Expenses from material_purchases
      if (purchasesRes.data) {
        const materialIds = [...new Set(purchasesRes.data.map(p => p.material_id))];
        let matMap = new Map<string, { name: string; category: string }>();
        if (materialIds.length > 0) {
          const { data: mats } = await supabase
            .from('user_materials')
            .select('id, name, category')
            .in('id', materialIds);
          if (mats) {
            matMap = new Map(mats.map(m => [m.id, { name: m.name, category: m.category }]));
          }
        }

        for (const p of purchasesRes.data) {
          if (Number(p.total_paid) <= 0) continue;
          const mat = matMap.get(p.material_id);
          allTx.push({
            id: `mp_${p.id}`,
            type: 'expense',
            amount: Number(p.total_paid),
            description: `Compra: ${mat?.name || 'Material'}`,
            category: 'Materiales',
            transaction_date: p.purchase_date,
            source: 'material_purchase',
            materialCategory: mat?.category || 'Sin categoría',
          });
        }
      }

      // Expenses from indirect_expenses
      if (expensesRes.data) {
        for (const e of expensesRes.data) {
          if (Number(e.monthly_amount) <= 0 || !e.payment_date) continue;
          allTx.push({
            id: `ie_${e.id}`,
            type: 'expense',
            amount: Number(e.monthly_amount),
            description: `Gasto del mes: ${e.description || ''}`,
            category: 'Gastos del mes',
            transaction_date: e.payment_date,
            source: 'indirect_expense',
          });
        }
      }

      // Expenses from reusable_materials (Inversiones)
      if (reusablesRes.data) {
        for (const r of reusablesRes.data) {
          if (Number(r.material_cost) <= 0 || !r.purchase_date) continue;
          allTx.push({
            id: `rm_${r.id}`,
            type: 'expense',
            amount: Number(r.material_cost),
            description: `Inversión en equipo: ${r.name || 'Material reutilizable'}`,
            category: 'Inversión en equipo',
            transaction_date: r.purchase_date,
            source: 'reusable_investment',
          });
        }
      }
      // Sort by date descending
      allTx.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
      setTransactions(allTx);
    } catch (err) {
      console.error('Error loading financial data:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { transactions, loading, reload: fetchAll };
}

/** Helper: filter transactions by month/year and compute totals */
export function useMonthlyFinancials(
  transactions: FinancialTransaction[],
  month: number, // 0-indexed
  year: number
) {
  return useMemo(() => {
    const monthNum = month + 1;
    const prefix = `${year}-${String(monthNum).padStart(2, '0')}`;

    const monthTx = transactions.filter(t => t.transaction_date.startsWith(prefix));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      monthTransactions: monthTx,
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
    };
  }, [transactions, month, year]);
}
