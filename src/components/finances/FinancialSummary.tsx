import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencyByCode } from '@/lib/currencies';
import { ShoppingBag, Receipt, Banknote } from 'lucide-react';

interface MaterialPurchaseItem {
  materialName: string;
  category: string;
  totalPaid: number;
}

interface ExpenseItem {
  description: string;
  amount: number;
}

interface IncomeItem {
  clientName: string;
  deposits: number;
  finalPayment: number;
  total: number;
}

interface FinancialSummaryProps {
  selectedMonth: number;
  selectedYear: number;
}

export function FinancialSummary({ selectedMonth, selectedYear }: FinancialSummaryProps) {
  const { user, profile } = useAuth();
  const [materials, setMaterials] = useState<MaterialPurchaseItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMaterials(), fetchExpenses(), fetchIncomes()]);
    setLoading(false);
  };

  const fetchMaterials = async () => {
    try {
      const monthNum = selectedMonth + 1;
      const startDate = `${selectedYear}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = monthNum === 12
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(monthNum + 1).padStart(2, '0')}-01`;

      const { data: purchases, error: purchaseError } = await supabase
        .from('material_purchases')
        .select('material_id, total_paid')
        .eq('user_id', user?.id)
        .gte('purchase_date', startDate)
        .lt('purchase_date', endDate);

      if (purchaseError) throw purchaseError;

      if (!purchases || purchases.length === 0) {
        setMaterials([]);
        return;
      }

      const materialIds = [...new Set(purchases.map(p => p.material_id))];
      const { data: mats, error: matError } = await supabase
        .from('user_materials')
        .select('id, name, category')
        .in('id', materialIds);

      if (matError) throw matError;

      const matMap = new Map((mats || []).map(m => [m.id, m]));

      // Aggregate by category
      const aggregated = new Map<string, MaterialPurchaseItem>();
      for (const p of purchases) {
        const mat = matMap.get(p.material_id);
        if (!mat) continue;
        const key = mat.category;
        if (aggregated.has(key)) {
          aggregated.get(key)!.totalPaid += Number(p.total_paid);
        } else {
          aggregated.set(key, {
            materialName: mat.category,
            category: mat.category,
            totalPaid: Number(p.total_paid),
          });
        }
      }

      setMaterials(Array.from(aggregated.values()));
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('indirect_expenses')
        .select('description, monthly_amount')
        .eq('user_id', user?.id);

      if (error) throw error;
      setExpenses((data || []).map(e => ({ description: e.description, amount: Number(e.monthly_amount) })));
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchIncomes = async () => {
    try {
      const monthNum = selectedMonth + 1;
      const startDate = `${selectedYear}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = monthNum === 12
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(monthNum + 1).padStart(2, '0')}-01`;

      // Fetch payments within the selected month (based on payment_date)
      const { data: payments, error: paymentsError } = await supabase
        .from('quote_payments')
        .select('quote_id, amount, is_paid')
        .eq('user_id', user?.id)
        .gte('payment_date', startDate)
        .lt('payment_date', endDate);

      if (paymentsError) throw paymentsError;
      if (!payments || payments.length === 0) {
        setIncomes([]);
        return;
      }

      // Get unique quote IDs from payments
      const quoteIds = [...new Set(payments.map(p => p.quote_id))];
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, client_name')
        .in('id', quoteIds);

      if (quotesError) throw quotesError;

      const quoteMap = new Map((quotes || []).map(q => [q.id, q.client_name]));

      // Group payments by quote
      const paymentsByQuote = new Map<string, { deposits: number; finalPayment: number }>();
      for (const p of payments) {
        const existing = paymentsByQuote.get(p.quote_id) || { deposits: 0, finalPayment: 0 };
        if (p.is_paid) {
          existing.finalPayment += Number(p.amount);
        } else {
          existing.deposits += Number(p.amount);
        }
        paymentsByQuote.set(p.quote_id, existing);
      }

      const incomeItems: IncomeItem[] = [];
      for (const [quoteId, totals] of paymentsByQuote) {
        const total = totals.deposits + totals.finalPayment;
        if (total <= 0) continue;
        incomeItems.push({
          clientName: quoteMap.get(quoteId) || 'Cliente',
          deposits: totals.deposits,
          finalPayment: totals.finalPayment,
          total,
        });
      }

      setIncomes(incomeItems);
    } catch (error) {
      console.error('Error fetching incomes:', error);
    }
  };

  // Group materials by category
  const materialsByCategory = materials.reduce<Record<string, MaterialPurchaseItem[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  const totalMaterials = materials.reduce((s, m) => s + m.totalPaid, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalDeposits = incomes.reduce((s, i) => s + i.deposits, 0);
  const totalIncomeEvents = incomes.reduce((s, i) => s + i.total, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando resumen financiero...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Resumen Financiero del Mes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Materials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Materiales comprados este mes</h3>
            </div>
            {materials.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin compras este mes</p>
            ) : (
              <div className="space-y-1">
                {materials.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-foreground">{idx + 1}. {item.category}</span>
                    <span className="font-medium">{currencySymbol}{item.totalPaid.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold text-sm">
              <span>Total</span>
              <span>{currencySymbol}{totalMaterials.toFixed(2)}</span>
            </div>
          </div>

          {/* Column 2: Monthly Expenses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Gastos del mes</h3>
            </div>
            {expenses.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin gastos registrados</p>
            ) : (
              <div className="space-y-1">
                {expenses.map((exp, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-foreground">{idx + 1}. {exp.description}</span>
                    <span className="font-medium">{currencySymbol}{exp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t font-semibold text-sm">
              <span>Total</span>
              <span>{currencySymbol}{totalExpenses.toFixed(2)}</span>
            </div>
          </div>

          {/* Column 3: Income */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Banknote className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Ingresos del mes</h3>
            </div>
            {incomes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Sin eventos entregados este mes</p>
            ) : (
              <div className="space-y-2">
                {incomes.map((inc, idx) => (
                  <div key={idx} className="text-sm space-y-0.5 pb-2 border-b border-dashed last:border-0">
                    <p className="font-medium text-foreground">{inc.clientName}</p>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Anticipo</span>
                      <span>{currencySymbol}{inc.deposits.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Pago final</span>
                      <span>{currencySymbol}{inc.finalPayment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-xs">
                      <span>Total</span>
                      <span>{currencySymbol}{inc.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total anticipos</span>
                <span className="font-medium">{currencySymbol}{totalDeposits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total ingresos</span>
                <span>{currencySymbol}{totalIncomeEvents.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
