import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Pencil, CalendarIcon, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function IndirectExpensesManager({ currencySymbol = '$' }: IndirectExpensesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<IndirectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsPerMonth, setEventsPerMonth] = useState<number>(0);

  // Month selector state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<IndirectExpense | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaymentDate, setFormPaymentDate] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const selectedMonthLabel = format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy", { locale: es });

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
      // Load events_per_month from profile
      supabase
        .from('profiles')
        .select('events_per_month')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.events_per_month) setEventsPerMonth(data.events_per_month);
        });
    }
  }, [user, loadExpenses]);

  // Filter expenses by selected month/year
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (!e.paymentDate) return false;
      const d = new Date(e.paymentDate + 'T12:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [expenses, selectedMonth, selectedYear]);

  // Total for filtered month
  const total = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
  }, [filteredExpenses]);

  const costPerEvent = useMemo(() => {
    if (eventsPerMonth <= 0 || total <= 0) return 0;
    return total / eventsPerMonth;
  }, [total, eventsPerMonth]);

  const handleEventsChange = async (value: number) => {
    setEventsPerMonth(value);
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ events_per_month: value })
      .eq('user_id', user.id);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getDefaultDateForMonth = () => {
    const today = new Date();
    if (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) {
      return format(today, 'yyyy-MM-dd');
    }
    return format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-dd');
  };

  const openAddDialog = () => {
    setEditingExpense(null);
    setFormDescription('');
    setFormAmount(0);
    setFormPaymentDate(getDefaultDateForMonth());
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
      await supabase.from('transactions').delete().eq('reference_id', refId).eq('user_id', user.id);
      return;
    }

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
      <div className="space-y-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <span className="text-xl">📊</span>
          Gastos del Mes
        </h1>

        {/* Month selector */}
        <Popover open={monthPickerOpen} onOpenChange={(open) => { setMonthPickerOpen(open); if (open) setPickerYear(selectedYear); }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between capitalize font-semibold h-11">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                {selectedMonthLabel}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-background" align="start">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-sm">{pickerYear}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedMonth(idx); setSelectedYear(pickerYear); setMonthPickerOpen(false); }}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                    idx === selectedMonth && pickerYear === selectedYear
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Total del mes */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">Total gastos del mes</span>
          <span className="text-sm font-bold text-primary">
            {currencySymbol}{formatCurrency(total)}
          </span>
        </div>

        {/* Eventos al mes */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <p className="text-sm font-medium text-foreground">Eventos al mes</p>
          <p className="text-xs text-muted-foreground">¿Cuántos eventos realizas en promedio al mes?</p>
          <div className="flex items-center gap-3">
            <NumericField
              min={0}
              step={1}
              value={eventsPerMonth || ''}
              onChange={(e) => handleEventsChange(Number(e.target.value) || 0)}
              className="max-w-[100px]"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">eventos/mes</span>
          </div>
          {eventsPerMonth > 0 && total > 0 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Costo por gasto</span>
                <span className="text-[11px] text-muted-foreground/70">Total ÷ Eventos</span>
              </div>
              <span className="text-sm font-bold text-primary">
                {currencySymbol}{formatCurrency(costPerEvent)}
              </span>
            </div>
          )}
        </div>

        {/* Button */}
        <Button
          variant="default"
          className="w-full h-12 text-base font-medium"
          onClick={openAddDialog}
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar gasto
        </Button>

        {/* Expense list */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No hay gastos registrados en este mes
            </div>
          )}

          {filteredExpenses.map((expense) => (
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
        </div>
      </div>

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
