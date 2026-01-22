import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { IndirectExpense } from '@/types/quote';

interface IndirectExpensesSectionProps {
  expenses: IndirectExpense[];
  onChange: (expenses: IndirectExpense[]) => void;
  currencySymbol?: string;
}

export function IndirectExpensesSection({ expenses, onChange, currencySymbol = '$' }: IndirectExpensesSectionProps) {
  const addExpense = () => {
    onChange([
      ...expenses,
      { id: crypto.randomUUID(), description: '', monthlyAmount: 0 },
    ]);
  };

  const updateExpense = (id: string, updates: Partial<IndirectExpense>) => {
    onChange(expenses.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExpense = (id: string) => {
    onChange(expenses.filter(e => e.id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">📊</span>
            <span>Gastos indirectos</span>
          </CardTitle>
          <div className="px-3 py-1.5 rounded-full bg-beige border border-border">
            <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Agrega tus gastos fijos mensuales (renta, luz, internet, etc.) para incluirlos en el costo real.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay gastos indirectos agregados
          </div>
        )}

        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="p-4 rounded-xl bg-beige/70 border border-border/50 animate-fade-in space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Descripción
                </label>
                <Input
                  value={expense.description}
                  onChange={(e) => updateExpense(expense.id, { description: e.target.value })}
                  placeholder="Ej: Renta del local, Luz, Internet"
                  className="h-11 text-base bg-background/50"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExpense(expense.id)}
                className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="w-full sm:w-48">
              <NumericField
                label="Monto mensual"
                prefix={currencySymbol}
                min={0}
                step={0.01}
                value={expense.monthlyAmount || ''}
                onChange={(e) => updateExpense(expense.id, { monthlyAmount: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        ))}

        <Button variant="secondary" className="w-full h-12 text-base font-medium" onClick={addExpense}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar gasto indirecto
        </Button>
      </CardContent>
    </Card>
  );
}
