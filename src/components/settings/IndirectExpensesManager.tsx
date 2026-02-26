import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IndirectExpense {
  id: string;
  description: string;
  monthlyAmount: number;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // For now, store in localStorage until we add the column to profiles
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

  const saveExpenses = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Store in localStorage for now
      localStorage.setItem(`indirect_expenses_${user.id}`, JSON.stringify(expenses));
      
      toast({
        title: "¡Guardado!",
        description: "Tus gastos indirectos han sido guardados",
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

  const total = expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Cargando gastos indirectos...
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
