import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PendingApproval } from '@/components/PendingApproval';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Pencil, FileText, CheckCircle, CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';
import { TransactionFormDialog } from '@/components/finances/TransactionFormDialog';
import { MonthlyCharts } from '@/components/finances/MonthlyCharts';
import { TransactionFilters } from '@/components/finances/TransactionFilters';
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

interface Filters {
  day: string;
  month: string;
  year: string;
  category: string;
  type: string;
}

interface QuoteStats {
  totalQuotes: number;
  paidQuotes: number;
}

export default function Finances() {
  const navigate = useNavigate();
  const { user, profile, isApproved, approvalStatus, isAdmin, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [quoteStats, setQuoteStats] = useState<QuoteStats>({ totalQuotes: 0, paidQuotes: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [filters, setFilters] = useState<Filters>({
    day: '',
    month: '',
    year: '',
    category: '',
    type: '',
  });

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  // Filter transactions based on active filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const [year, month, day] = t.transaction_date.split('-');
      
      if (filters.day && parseInt(day) !== parseInt(filters.day)) return false;
      if (filters.month && month !== filters.month) return false;
      if (filters.year && year !== filters.year) return false;
      if (filters.category && t.category !== filters.category) return false;
      if (filters.type && t.type !== filters.type) return false;
      
      return true;
    });
  }, [transactions, filters]);

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchQuoteStats();
    }
  }, [user]);

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

  const fetchQuoteStats = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = currentMonth === 12
        ? `${currentYear + 1}-01-01`
        : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

      const { data: allQuotes, error: err1 } = await supabase
        .from('quotes')
        .select('id, status, created_at')
        .eq('user_id', user?.id)
        .gte('created_at', startDate)
        .lt('created_at', endDate);

      if (err1) throw err1;

      const total = allQuotes?.length || 0;
      const paid = allQuotes?.filter(q => q.status === 'delivered' || q.status === 'approved').length || 0;

      setQuoteStats({ totalQuotes: total, paidQuotes: paid });
    } catch (error) {
      console.error('Error fetching quote stats:', error);
    }
  };

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

  const selectedMonthTransactions = transactions.filter(t => {
    const [y, m] = t.transaction_date.split('-');
    return parseInt(y) === selectedYear && parseInt(m) === selectedMonth + 1;
  });

  const totalIncome = selectedMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalExpenses = selectedMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const balance = totalIncome - totalExpenses;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
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
              Control de ingresos y gastos
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar más
          </Button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium capitalize text-sm">{selectedMonthLabel}</span>
          </div>
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
                  <p className="text-sm text-green-600 font-medium">Ingresos</p>
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
                  <p className="text-sm text-red-600 font-medium">Gastos</p>
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
                    {balance >= 0 ? 'Ganancia' : 'Pérdida'}
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
                  <p className="text-sm text-purple-600 font-medium">Cotizaciones Realizadas</p>
                  <p className="text-2xl font-bold text-purple-700">{quoteStats.totalQuotes}</p>
                  <p className="text-xs text-purple-500">Este mes</p>
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
                  <p className="text-sm text-emerald-600 font-medium">Cotizaciones Pagadas</p>
                  <p className="text-2xl font-bold text-emerald-700">{quoteStats.paidQuotes}</p>
                  <p className="text-xs text-emerald-500">Este mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Charts */}
        <MonthlyCharts transactions={transactions} currencySymbol={currencySymbol} />

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            
            {loadingTransactions ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando transacciones...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {transactions.length === 0 
                  ? "No hay transacciones registradas. ¡Agrega tu primera transacción!"
                  : "No hay transacciones que coincidan con los filtros seleccionados."
                }
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'income' 
                          ? 'bg-green-100' 
                          : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(transaction.transaction_date + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                          {transaction.category && ` • ${transaction.category}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {currencySymbol}{Number(transaction.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
