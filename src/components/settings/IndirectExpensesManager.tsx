import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IndirectExpense {
  id: string;
  description: string;
  monthlyAmount: number;
  paymentDate?: string;
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

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IndirectExpense | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentDate, setFormPaymentDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const loadExpenses = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('indirect_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setExpenses(data.map(e => ({
          id: e.id,
          description: e.description,
          monthlyAmount: Number(e.monthly_amount),
          paymentDate: e.payment_date || undefined,
          registeredInFinances: e.registered_in_finances,
        })));
      } else {
        // Migrate from localStorage if exists
        const stored = localStorage.getItem(`indirect_expenses_${user.id}`);
        if (stored) {
          const localExpenses: IndirectExpense[] = JSON.parse(stored);
          if (localExpenses.length > 0) {
            const rows = localExpenses.map(e => ({
              user_id: user.id,
              description: e.description || '',
              monthly_amount: e.monthlyAmount || 0,
              payment_date: e.paymentDate || null,
              registered_in_finances: e.registeredInFinances || false,
            }));
            const { data: inserted, error: insertErr } = await supabase
              .from('indirect_expenses')
              .insert(rows)
              .select();
            if (!insertErr && inserted) {
              setExpenses(inserted.map(e => ({
                id: e.id,
                description: e.description,
                monthlyAmount: Number(e.monthly_amount),
                paymentDate: e.payment_date || undefined,
                registeredInFinances: e.registered_in_finances,
              })));
              localStorage.removeItem(`indirect_expenses_${user.id}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user, loadExpenses]);

  const openAddDialog = () => {
    setEditingExpense(null);
    setFormDescription('');
    setFormAmount(0);
    setFormPaymentDate('');
    setDialogOpen(true);
  };

  const openEditDialog = (expense: IndirectExpense) => {
    setEditingExpense(expense);
    setFormDescription(expense.description);
    setFormAmount(expense.monthlyAmount);
    setFormPaymentDate(expense.paymentDate || '');
    setDialogOpen(true);
  };

  const syncTransactionForExpense = async (expenseId: string, description: string, amount: number, paymentDate: string | null) => {
    if (!user) return;
    const refId = `indirect_expense_${expenseId}`;

    if (!paymentDate || amount <= 0) {
      // Remove transaction if no date or zero amount
      await supabase.from('transactions').delete().eq('reference_id', refId).eq('user_id', user.id);
      return;
    }

    // Check if transaction already exists
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference_id', refId)
      .eq('user_id', user.id)
      .maybeSingle();

    const txData = {
      user_id: user.id,
      type: 'expense' as const,
      description: `Gasto del mes: ${description}`,
      amount,
      category: 'Gastos del mes',
      transaction_date: paymentDate,
      reference_id: refId,
    };

    if (existing) {
      await supabase.from('transactions').update(txData).eq('id', existing.id);
    } else {
      await supabase.from('transactions').insert(txData);
    }
  };

  const deleteTransactionForExpense = async (expenseId: string) => {
    if (!user) return;
    await supabase.from('transactions').delete().eq('reference_id', `indirect_expense_${expenseId}`).eq('user_id', user.id);
  };

  const isFormValid = formDescription.trim().length > 0 && formAmount > 0 && formPaymentDate.length > 0;

  const handleSave = async () => {
    if (!user || !formDescription.trim()) {
      toast({ title: 'Error', description: 'Agrega una descripción', variant: 'destructive' });
      return;
    }
    if (formAmount <= 0) {
      toast({ title: 'Error', description: 'El monto debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    if (!formPaymentDate) {
      toast({ title: 'Error', description: 'Selecciona una fecha de pago', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const row = {
        user_id: user.id,
        description: formDescription.trim(),
        monthly_amount: formAmount,
        payment_date: formPaymentDate || null,
        registered_in_finances: !!formPaymentDate,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('indirect_expenses')
          .update(row)
          .eq('id', editingExpense.id);
        if (error) throw error;
        await syncTransactionForExpense(editingExpense.id, formDescription.trim(), formAmount, formPaymentDate || null);
        toast({ title: '¡Actualizado!', description: 'Gasto actualizado correctamente' });
      } else {
        const { data: inserted, error } = await supabase
          .from('indirect_expenses')
          .insert(row)
          .select('id')
          .single();
        if (error) throw error;
        if (inserted) {
          await syncTransactionForExpense(inserted.id, formDescription.trim(), formAmount, formPaymentDate || null);
        }
        toast({ title: '¡Registrado!', description: 'Gasto registrado correctamente' });
      }

      setDialogOpen(false);
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el gasto', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const removeExpense = async (id: string) => {
    if (!user) return;
    setExpenses(expenses.filter(e => e.id !== id));

    try {
      const { error } = await supabase
        .from('indirect_expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      await deleteTransactionForExpense(id);
      toast({ title: 'Eliminado', description: 'Gasto eliminado de gastos y finanzas' });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el gasto', variant: 'destructive' });
      loadExpenses();
    }
  };

  // Only sum expenses from the latest registered month
  const total = (() => {
    const withDates = expenses.filter(e => e.paymentDate);
    if (withDates.length === 0) return expenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);

    let latestY = 0, latestM = 0;
    withDates.forEach(e => {
      const [y, m] = e.paymentDate!.split('-');
      const yr = parseInt(y), mo = parseInt(m);
      if (yr > latestY || (yr === latestY && mo > latestM)) {
        latestY = yr;
        latestM = mo;
      }
    });

    return withDates
      .filter(e => {
        const [y, m] = e.paymentDate!.split('-');
        return parseInt(y) === latestY && parseInt(m) === latestM;
      })
      .reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
  })();

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
    <>
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Gastos del mes</CardTitle>
              <CardDescription>
                Tus gastos fijos mensuales (renta, luz, internet, etc.)
              </CardDescription>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-beige border border-border">
              <span className="text-sm font-bold text-foreground tabular-nums">
                {currencySymbol}{formatCurrency(total)}/mes
              </span>
            </div>
          </div>
          <Button
            variant="default"
            className="w-full h-12 text-base font-medium mt-4"
            onClick={openAddDialog}
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar gasto
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay gastos del mes registrados
            </div>
          )}

          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="p-4 rounded-xl bg-beige/70 border border-border/50 animate-fade-in"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{expense.description}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {currencySymbol}{formatCurrency(expense.monthlyAmount)}/mes
                  </p>
                  {expense.paymentDate && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(expense.paymentDate + 'T12:00:00'), "dd MMM yyyy", { locale: es })}
                      {expense.registeredInFinances && (
                        <span className="text-green-600 flex items-center gap-0.5 ml-2">
                          <Check className="w-3 h-3" /> En Finanzas
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(expense)}
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExpense(expense.id)}
                    className="h-9 w-9 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog for adding/editing */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Editar gasto' : 'Registrar gasto del mes'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Descripción
              </label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ej: Renta del local, Luz, Internet"
                className="h-11"
              />
            </div>
            <div>
              <NumericField
                label="Monto mensual"
                prefix={currencySymbol}
                min={0}
                step={0.01}
                value={formAmount || ''}
                onChange={(e) => setFormAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Fecha de pago
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal",
                      !formPaymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formPaymentDate
                      ? format(new Date(formPaymentDate + 'T12:00:00'), "dd MMM yyyy", { locale: es })
                      : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formPaymentDate ? new Date(formPaymentDate + 'T12:00:00') : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormPaymentDate(format(date, 'yyyy-MM-dd'));
                      }
                    }}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !isFormValid}>
              {saving ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
