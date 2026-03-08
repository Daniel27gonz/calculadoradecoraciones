import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuote } from '@/contexts/QuoteContext';
import { supabase } from '@/integrations/supabase/client';
import { PendingApproval } from '@/components/PendingApproval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Pencil, FileText, CheckCircle, CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';
import { TransactionFormDialog } from '@/components/finances/TransactionFormDialog';
import { MonthlyCharts } from '@/components/finances/MonthlyCharts';
import { FinancialSummary } from '@/components/finances/FinancialSummary';
import { TransactionFilters } from '@/components/finances/TransactionFilters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  transaction_date: string;
  created_at: string;
}

interface QuoteStats {
  totalQuotes: number;
  paidQuotes: number;
}

export default function Finances() {
  const { quotes, calculateCosts } = useQuote();
  const navigate = useNavigate();
  const { user, profile, isApproved, approvalStatus, isAdmin, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [quotePayments, setQuotePayments] = useState<Record<string, number>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [realTotalExpenses, setRealTotalExpenses] = useState(0);
  const [realTotalIncome, setRealTotalIncome] = useState(0);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);
  
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  // Transactions filtered by selected month
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [y, m] = t.transaction_date.split('-');
      return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Further filter by type and category
  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [monthTransactions, filterType, filterCategory]);

  // Summary cards based on filtered transactions
  const filteredIncome = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );
  const filteredExpense = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0),
    [filteredTransactions]
  );
  const filteredBalance = filteredIncome - filteredExpense;

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRealExpenses();
      fetchQuotePayments();
    }
  }, [user, selectedMonth, selectedYear]);

  const fetchRealExpenses = async () => {
    try {
      const monthNum = selectedMonth + 1;
      const startDate = `${selectedYear}-${String(monthNum).padStart(2, '0')}-01`;
      const endDate = monthNum === 12
        ? `${selectedYear + 1}-01-01`
        : `${selectedYear}-${String(monthNum + 1).padStart(2, '0')}-01`;

      const [expensesRes, purchasesRes] = await Promise.all([
        supabase
          .from('indirect_expenses')
          .select('monthly_amount')
          .eq('user_id', user?.id)
          .gte('payment_date', startDate)
          .lt('payment_date', endDate),
        supabase
          .from('material_purchases')
          .select('total_paid')
          .eq('user_id', user?.id)
          .gte('purchase_date', startDate)
          .lt('purchase_date', endDate),
      ]);

      const indirectTotal = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.monthly_amount), 0);
      const purchasesTotal = (purchasesRes.data || []).reduce((sum, p) => sum + Number(p.total_paid), 0);
      setRealTotalExpenses(indirectTotal + purchasesTotal);
    } catch (error) {
      console.error('Error fetching real expenses:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions((data || []).map(t => ({
        ...t,
        type: t.type as 'income' | 'expense',
        category: t.category ?? null,
      })));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las transacciones",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchQuotePayments = async () => {
    try {
      const { data: payments } = await supabase
        .from('quote_payments')
        .select('quote_id, amount')
        .eq('user_id', user?.id);

      const byQuote: Record<string, number> = {};
      (payments || []).forEach(p => {
        byQuote[p.quote_id] = (byQuote[p.quote_id] || 0) + Number(p.amount);
      });
      setQuotePayments(byQuote);
    } catch (error) {
      console.error('Error fetching quote payments:', error);
    }
  };

  // Compute quote stats from context quotes
  const quoteStats = useMemo(() => {
    const monthNum = selectedMonth + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const prefix = `${selectedYear}-${monthStr}`;

    // Cotizaciones realizadas: created in selected month
    const totalQuotes = quotes.filter(q => q.createdAt?.startsWith(prefix)).length;

    // Pedidos pagados: status "delivered" with eventDate in selected month
    const paidQuotes = quotes.filter(q =>
      q.status === 'delivered' && q.eventDate?.startsWith(prefix)
    ).length;

    return { totalQuotes, paidQuotes };
  }, [quotes, selectedMonth, selectedYear]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setTransactions(transactions.filter(t => t.id !== deleteId));
      toast({
        title: "Transacción eliminada",
        description: "La transacción se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSaved = () => {
    fetchTransactions();
    handleDialogClose();
  };

  const totalIncome = filteredIncome;
  const totalExpenses = (filterType === 'all' && filterCategory === 'all') ? realTotalExpenses : filteredExpense;
  const balance = totalIncome - totalExpenses;

  const handlePrevMonth = () => {
    setFilterType('all');
    setFilterCategory('all');
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
      setPickerYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setFilterType('all');
    setFilterCategory('all');
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
      setPickerYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const selectedMonthLabel = format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy", { locale: es });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">💰</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Block non-approved users (admins bypass)
  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24 md:pb-8">
      <div className="container max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Finanzas del Negocio
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Resumen financiero del mes seleccionado
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-accent transition-colors cursor-pointer">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium capitalize text-sm">{selectedMonthLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="center">
              <div className="flex items-center justify-between mb-3">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-sm">{pickerYear}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
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
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Ingresos del mes</p>
                  <p className="text-xl font-bold text-green-700">
                    {currencySymbol}{totalIncome.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-600 font-medium">Gastos y compras del mes</p>
                  <p className="text-xl font-bold text-red-700">
                    {currencySymbol}{totalExpenses.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <DollarSign className={`w-5 h-5 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {balance >= 0 ? 'Ganancia del mes' : 'Pérdida del mes'}
                  </p>
                  <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                    {currencySymbol}{balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quote Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                   <p className="text-sm text-purple-600 font-medium">Cotizaciones realizadas</p>
                   <p className="text-2xl font-bold text-purple-700">{quoteStats.totalQuotes}</p>
                   <p className="text-xs text-purple-500">este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                   <p className="text-sm text-emerald-600 font-medium">Eventos realizados</p>
                   <p className="text-2xl font-bold text-emerald-700">{quoteStats.paidQuotes}</p>
                   <p className="text-xs text-emerald-500">este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Financial Summary */}
        <FinancialSummary selectedMonth={selectedMonth} selectedYear={selectedYear} />

        {/* Transactions List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Historial de Transacciones</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{selectedMonthLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-sm">{pickerYear}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedMonth(idx); setSelectedYear(pickerYear); setFilterType('all'); setFilterCategory('all'); }}
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
            </div>

            {/* Inline Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
                <p className="text-xs text-green-600 font-medium">Ingresos</p>
                <p className="text-base font-bold text-green-600">{currencySymbol}{filteredIncome.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <p className="text-xs text-red-600 font-medium">Gastos</p>
                <p className="text-base font-bold text-red-600">{currencySymbol}{filteredExpense.toFixed(2)}</p>
              </div>
              <div className={`rounded-lg px-3 py-2.5 border ${filteredBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-xs font-medium ${filteredBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
                <p className={`text-base font-bold ${filteredBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {filteredBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(filteredBalance).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-3">
              <TransactionFilters
                transactions={monthTransactions}
                filterType={filterType}
                filterCategory={filterCategory}
                onTypeChange={setFilterType}
                onCategoryChange={setFilterCategory}
              />
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {loadingTransactions ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando transacciones...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {transactions.length === 0 
                  ? "No hay transacciones registradas."
                  : "No hay transacciones que coincidan con los filtros."
                }
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted-foreground px-6 py-2.5">Fecha</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Tipo</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Categoría</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Descripción</th>
                      <th className="text-right font-medium text-muted-foreground px-6 py-2.5">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-3 whitespace-nowrap">
                          {format(new Date(transaction.transaction_date + 'T12:00:00'), "dd/MM/yyyy")}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{transaction.category || '—'}</td>
                        <td className="px-3 py-3">{transaction.description}</td>
                        <td className={`px-6 py-3 text-right font-semibold whitespace-nowrap ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '' : '-'}{currencySymbol}{Number(transaction.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-6 py-3 font-medium text-muted-foreground">
                        Total ({filteredTransactions.length} registros)
                      </td>
                      <td className="px-6 py-3 text-right font-bold">
                        {currencySymbol}{(filteredIncome - filteredExpense) < 0 ? '-' : ''}{Math.abs(filteredIncome - filteredExpense).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Form Dialog */}
        <TransactionFormDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          transaction={editingTransaction}
          onSaved={handleTransactionSaved}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La transacción será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
