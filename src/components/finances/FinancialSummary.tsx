import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrencyByCode } from '@/lib/currencies';
import { ShoppingBag, Receipt, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { FinancialTransaction } from '@/hooks/useFinancialData';

interface FinancialSummaryProps {
  transactions: FinancialTransaction[];
  loading?: boolean;
}

export function FinancialSummary({ transactions, loading }: FinancialSummaryProps) {
  const { profile } = useAuth();
  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  // Derive materials breakdown by category
  const materials = useMemo(() => {
    const matTx = transactions.filter(t => t.source === 'material_purchase');
    const byCategory = new Map<string, number>();
    for (const t of matTx) {
      const cat = t.materialCategory || 'Sin categoría';
      byCategory.set(cat, (byCategory.get(cat) || 0) + t.amount);
    }
    return Array.from(byCategory.entries()).map(([category, total]) => ({ category, total }));
  }, [transactions]);

  // Derive indirect expenses list
  const expenses = useMemo(() => {
    return transactions
      .filter(t => t.source === 'indirect_expense')
      .map(t => ({
        description: t.description.replace('Gasto del mes: ', ''),
        amount: t.amount,
      }));
  }, [transactions]);

  // Derive incomes grouped by client
  const incomes = useMemo(() => {
    const incomeTx = transactions.filter(t => t.source === 'quote_payment');
    const byClient = new Map<string, { deposits: number; finalPayment: number }>();
    for (const t of incomeTx) {
      const name = t.clientName || 'Cliente';
      const existing = byClient.get(name) || { deposits: 0, finalPayment: 0 };
      if (t.isPaid) {
        existing.finalPayment += t.amount;
      } else {
        existing.deposits += t.amount;
      }
      byClient.set(name, existing);
    }
    return Array.from(byClient.entries()).map(([clientName, totals]) => ({
      clientName,
      deposits: totals.deposits,
      finalPayment: totals.finalPayment,
      total: totals.deposits + totals.finalPayment,
    }));
  }, [transactions]);

  const totalMaterials = materials.reduce((s, m) => s + m.total, 0);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                    <span className="font-medium">{currencySymbol}{item.total.toFixed(2)}</span>
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
              <p className="text-xs text-muted-foreground py-2">Sin decoraciones realizadas este mes</p>
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
