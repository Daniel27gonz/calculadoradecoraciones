import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IndirectExpense {
  id: string;
  description: string;
  monthlyAmount: number;
  paymentDate?: string; // ISO date string
  registeredInFinances?: boolean;
}

interface IndirectExpensesManagerProps {
  currencySymbol?: string;
}

export function IndirectExpensesManager({ currencySymbol = '$' }: IndirectExpensesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<IndirectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const stored = localStorage.getItem(`indirect_expenses_${user.id}`);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerExpenseInFinances = async (expense: IndirectExpense) => {
    if (!user || !expense.paymentDate || !expense.description || !expense.monthlyAmount) return false;

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        description: `Gasto del mes: ${expense.description}`,
        amount: expense.monthlyAmount,
        category: 'Gastos del mes',
        transaction_date: expense.paymentDate,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error registering expense in finances:', error);
      return false;
    }
  };

  const saveExpenses = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      let registeredCount = 0;

      const updatedExpenses = await Promise.all(
        expenses.map(async (expense) => {
          if (expense.paymentDate && !expense.registeredInFinances && expense.monthlyAmount > 0 && expense.description) {
            const success = await registerExpenseInFinances(expense);
            if (success) {
              registeredCount++;
              return { ...expense, registeredInFinances: true };
            }
          }
          return expense;
        })
      );

      setExpenses(updatedExpenses);
      localStorage.setItem(`indirect_expenses_${user.id}`, JSON.stringify(updatedExpenses));
      
      toast({
        title: "¡Guardado!",
        description: registeredCount > 0
          ? `Gastos guardados. ${registeredCount} gasto(s) registrado(s) en Finanzas.`
          : "Tus gastos del mes han sido guardados",
      });
    } catch (error) {
      console.error('Error saving expenses:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los gastos",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addExpense = () => {
    setExpenses([
      ...expenses,
      { id: crypto.randomUUID(), description: '', monthlyAmount: 0 },
    ]);
  };

  const updateExpense = (id: string, updates: Partial<IndirectExpense>) => {
    setExpenses(expenses.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Find the latest month that has registered expenses
  const latestMonthExpenses = (() => {
    const withDates = expenses.filter(e => e.paymentDate);
    if (withDates.length === 0) return [];
    
    // Find the latest year-month
    let latestY = 0, latestM = 0;
    withDates.forEach(e => {
      const [y, m] = e.paymentDate!.split('-');
      const yr = parseInt(y), mo = parseInt(m);
      if (yr > latestY || (yr === latestY && mo > latestM)) {
        latestY = yr;
        latestM = mo;
      }
    });
    
    return withDates.filter(e => {
      const [y, m] = e.paymentDate!.split('-');
      return parseInt(y) === latestY && parseInt(m) === latestM;
    });
  })();

  const total = latestMonthExpenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando gastos del mes...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Gastos del mes</CardTitle>
            <CardDescription>
              Agrega tus gastos fijos mensuales (renta, luz, internet, etc.)
            </CardDescription>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-beige border border-border">
            <span className="text-sm font-bold text-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}/mes
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay gastos del mes agregados
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

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 sm:w-48">
                <NumericField
                  label="Monto mensual"
                  prefix={currencySymbol}
                  min={0}
                  step={0.01}
                  value={expense.monthlyAmount || ''}
                  onChange={(e) => updateExpense(expense.id, { monthlyAmount: Number(e.target.value) || 0 })}
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Fecha de pago
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-left font-normal bg-background/50",
                        !expense.paymentDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expense.paymentDate
                        ? format(new Date(expense.paymentDate + 'T12:00:00'), "dd MMM yyyy", { locale: es })
                        : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expense.paymentDate ? new Date(expense.paymentDate + 'T12:00:00') : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const iso = format(date, 'yyyy-MM-dd');
                          updateExpense(expense.id, { paymentDate: iso, registeredInFinances: false });
                        }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {expense.registeredInFinances && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Registrado en Finanzas
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" className="flex-1 h-12 text-base font-medium" onClick={addExpense}>
            <Plus className="w-5 h-5 mr-2" />
            Agregar gasto
          </Button>
          {expenses.length > 0 && (
            <Button 
              variant="default" 
              className="flex-1 h-12 text-base font-medium" 
              onClick={saveExpenses}
              disabled={saving}
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
