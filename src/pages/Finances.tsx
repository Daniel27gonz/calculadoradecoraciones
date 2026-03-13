import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuote } from '@/contexts/QuoteContext';
import { PendingApproval } from '@/components/PendingApproval';
import { CancelledSubscription } from '@/components/CancelledSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle, CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Receipt, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';
import { FinancialSummary } from '@/components/finances/FinancialSummary';
import { TransactionFilters } from '@/components/finances/TransactionFilters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFinancialData, useMonthlyFinancials } from '@/hooks/useFinancialData';

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default function Finances() {
  const { quotes } = useQuote();
  const navigate = useNavigate();
  const { user, profile, isApproved, approvalStatus, isAdmin, isCancelled, loading: authLoading } = useAuth();

  const { transactions: allTransactions, loading: loadingTransactions } = useFinancialData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);

  // Independent month/year for transaction history
  const [txMonth, setTxMonth] = useState(new Date().getMonth());
  const [txYear, setTxYear] = useState(new Date().getFullYear());
  const [txPickerOpen, setTxPickerOpen] = useState(false);
  const [txPickerYear, setTxPickerYear] = useState(txYear);

  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  // Summary cards use unified source
  const { totalIncome, totalExpenses, totalMaterialPurchases, totalIndirectExpenses, totalInvestments, balance, monthTransactions: summaryMonthTx } = useMonthlyFinancials(allTransactions, selectedMonth, selectedYear);

  // Transaction history uses its own independent month
  const { monthTransactions } = useMonthlyFinancials(allTransactions, txMonth, txYear);

  // Adapt to legacy Transaction interface for TransactionFilters
  const legacyMonthTx = useMemo(() => monthTransactions.map(t => ({
    ...t,
    created_at: t.transaction_date,
  })), [monthTransactions]);

  // Further filter by type and category
  const filteredTransactions = useMemo(() => {
    return legacyMonthTx.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [legacyMonthTx, filterType, filterCategory]);

  const filteredIncome = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );
  const filteredExpense = useMemo(() =>
    filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );
  const filteredBalance = filteredIncome - filteredExpense;

  // Compute quote stats
  const quoteStats = useMemo(() => {
    const monthStr = String(selectedMonth + 1).padStart(2, '0');
    const prefix = `${selectedYear}-${monthStr}`;
    const totalQuotes = quotes.filter(q => q.createdAt?.startsWith(prefix)).length;
    const paidQuotes = quotes.filter(q =>
      q.status === 'delivered' && q.eventDate?.startsWith(prefix)
    ).length;
    return { totalQuotes, paidQuotes };
  }, [quotes, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
      setPickerYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
      setPickerYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const selectedMonthLabel = format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy", { locale: es });
  const txMonthLabel = format(new Date(txYear, txMonth, 1), "MMMM yyyy", { locale: es });

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

  if (!isAdmin && isCancelled) {
    return <CancelledSubscription />;
  }
  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen w-full max-w-full pt-16 md:pt-24 pb-24 md:pb-8 overflow-x-hidden">
      <div className="w-full max-w-4xl min-w-0 mx-auto px-4 md:px-6 space-y-4 md:space-y-6 overflow-x-hidden">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-3xl font-display font-bold text-foreground">
            Finanzas del Negocio
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Resumen financiero del mes seleccionado
          </p>
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

        {/* Summary Cards - auto-fit responsive grid */}
        <div className="grid gap-3 w-full max-w-full [&>*]:w-full [&>*]:min-w-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))' }}>
          {/* Ingresos */}
          <Card className="bg-green-50/80 border-green-200">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className="p-1.5 bg-green-100 rounded-full mb-1.5">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-[10px] sm:text-xs text-green-600 font-medium">Ingresos</p>
              <p className="text-sm sm:text-base font-bold text-green-700 truncate w-full">
                {currencySymbol}{totalIncome.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Gastos */}
          <Card className="bg-red-50/80 border-red-200">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className="p-1.5 bg-red-100 rounded-full mb-1.5">
                <Receipt className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-[10px] sm:text-xs text-red-600 font-medium">Gastos</p>
              <p className="text-sm sm:text-base font-bold text-red-700 truncate w-full">
                {currencySymbol}{totalIndirectExpenses.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Inversión equipo */}
          <Card className="bg-purple-50/80 border-purple-200">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className="p-1.5 bg-purple-100 rounded-full mb-1.5">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-[10px] sm:text-xs text-purple-600 font-medium">Inversión equipo</p>
              <p className="text-sm sm:text-base font-bold text-purple-700 truncate w-full">
                {currencySymbol}{totalInvestments.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Ganancia/Pérdida */}
          <Card className={balance >= 0 ? "bg-blue-50/80 border-blue-200" : "bg-orange-50/80 border-orange-200"}>
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className={`p-1.5 rounded-full mb-1.5 ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <DollarSign className={`w-4 h-4 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <p className={`text-[10px] sm:text-xs font-medium ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {balance >= 0 ? 'Ganancia' : 'Pérdida'}
              </p>
              <p className={`text-sm sm:text-base font-bold truncate w-full ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                {currencySymbol}{balance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Cotizaciones */}
          <Card className="bg-amber-50/80 border-amber-200">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className="p-1.5 bg-amber-100 rounded-full mb-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] sm:text-xs text-amber-600 font-medium">Cotizaciones</p>
              <p className="text-sm sm:text-base font-bold text-amber-700">{quoteStats.totalQuotes}</p>
            </CardContent>
          </Card>

          {/* Decoraciones */}
          <Card className="bg-emerald-50/80 border-emerald-200">
            <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center">
              <div className="p-1.5 bg-emerald-100 rounded-full mb-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-600 font-medium">Decoraciones</p>
              <p className="text-sm sm:text-base font-bold text-emerald-700">{quoteStats.paidQuotes}</p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <FinancialSummary transactions={summaryMonthTx} loading={loadingTransactions} />

        {/* Transactions List */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base sm:text-lg font-bold">Historial de Transacciones</CardTitle>
              <Popover open={txPickerOpen} onOpenChange={setTxPickerOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer self-start">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{txMonthLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="end">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTxPickerYear(y => y - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-semibold text-sm">{txPickerYear}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTxPickerYear(y => y + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((name, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setTxMonth(idx); setTxYear(txPickerYear); setTxPickerOpen(false); setFilterType('all'); setFilterCategory('all'); }}
                        className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                          idx === txMonth && txPickerYear === txYear
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
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-2 sm:px-3 py-2">
                <p className="text-[10px] sm:text-xs text-green-600 font-medium">Ingresos</p>
                <p className="text-sm sm:text-base font-bold text-green-600 truncate">{currencySymbol}{filteredIncome.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-200 px-2 sm:px-3 py-2">
                <p className="text-[10px] sm:text-xs text-red-600 font-medium">Gastos</p>
                <p className="text-sm sm:text-base font-bold text-red-600 truncate">{currencySymbol}{filteredExpense.toFixed(2)}</p>
              </div>
              <div className={`rounded-lg px-2 sm:px-3 py-2 border ${filteredBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className={`text-[10px] sm:text-xs font-medium ${filteredBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
                <p className={`text-sm sm:text-base font-bold truncate ${filteredBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {filteredBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(filteredBalance).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-3">
              <TransactionFilters
                transactions={legacyMonthTx}
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
                {allTransactions.length === 0 
                  ? "No hay transacciones registradas."
                  : "No hay transacciones que coincidan con los filtros."
                }
              </div>
            ) : (
              <>
              {/* Mobile: card layout */}
              <div className="sm:hidden space-y-2 px-4 pb-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(transaction.transaction_date + 'T12:00:00'), "dd/MM/yy")}
                        </span>
                      </div>
                      <p className="text-sm font-medium truncate">{transaction.description}</p>
                      {transaction.category && (
                        <p className="text-[10px] text-muted-foreground truncate">{transaction.category}</p>
                      )}
                    </div>
                    <p className={`text-sm font-bold ml-3 shrink-0 ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border text-sm font-medium px-1">
                  <span className="text-muted-foreground">Total ({filteredTransactions.length})</span>
                  <span className="font-bold">
                    {filteredBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(filteredBalance).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Desktop: table layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-medium text-muted-foreground px-4 md:px-6 py-2.5">Fecha</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Tipo</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Categoría</th>
                      <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Descripción</th>
                      <th className="text-right font-medium text-muted-foreground px-4 md:px-6 py-2.5">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
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
                        <td className={`px-4 md:px-6 py-3 text-right font-semibold whitespace-nowrap ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '' : '-'}{currencySymbol}{transaction.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border">
                      <td colSpan={4} className="px-4 md:px-6 py-3 font-medium text-muted-foreground">
                        Total ({filteredTransactions.length} registros)
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right font-bold">
                        {filteredBalance < 0 ? '-' : ''}{currencySymbol}{Math.abs(filteredBalance).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
