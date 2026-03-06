import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Wallet, Calendar, Package, TrendingUp, AlertCircle, DollarSign, CreditCard, Users, RefreshCw } from 'lucide-react';
import balloonBg from '@/assets/balloon-bg.jpg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import InstallPrompt from '@/components/InstallPrompt';
import FirstLoginInstallPrompt from '@/components/FirstLoginInstallPrompt';
import { PendingApproval } from '@/components/PendingApproval';
import { useEffect, useMemo, useState } from 'react';
import { getCurrencyByCode } from '@/lib/currencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { MonthlyCharts } from '@/components/finances/MonthlyCharts';

export default function Home() {
  const navigate = useNavigate();
  const { quotes, calculateCosts } = useQuote();
  const { user, profile, loading, isApproved, approvalStatus, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<{ id: string; type: 'income' | 'expense'; amount: number; description: string; category: string | null; transaction_date: string; created_at: string }[]>([]);
  const [realTotalExpenses, setRealTotalExpenses] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .then(({ data }) => {
          if (data) setTransactions(data.map(t => ({ ...t, type: t.type as 'income' | 'expense', category: t.category ?? null })));
        });
    }
  }, [user]);

  // Fetch real expenses (same logic as Finances/Mi Dinero)
  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const monthNum = now.getMonth() + 1;
    const year = now.getFullYear();
    const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
    const endDate = monthNum === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`;

    Promise.all([
      supabase
        .from('indirect_expenses')
        .select('monthly_amount')
        .eq('user_id', user.id)
        .gte('payment_date', startDate)
        .lt('payment_date', endDate),
      supabase
        .from('material_purchases')
        .select('total_paid')
        .eq('user_id', user.id)
        .gte('purchase_date', startDate)
        .lt('purchase_date', endDate),
    ]).then(([expensesRes, purchasesRes]) => {
      const indirectTotal = (expensesRes.data || []).reduce((sum, e) => sum + Number(e.monthly_amount), 0);
      const purchasesTotal = (purchasesRes.data || []).reduce((sum, p) => sum + Number(p.total_paid), 0);
      setRealTotalExpenses(indirectTotal + purchasesTotal);
    });
  }, [user]);

  const currencySymbol = useMemo(() => {
    const currency = getCurrencyByCode(profile?.currency || 'USD');
    return currency?.symbol || '$';
  }, [profile?.currency]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const currentMonthTx = transactions.filter(t => {
      const [y, m] = t.transaction_date.split('-');
      return parseInt(y) === currentYear && parseInt(m) === currentMonth;
    });

    const income = currentMonthTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = currentMonthTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
  }, [transactions]);


  const pendingQuotes = useMemo(() => {
    return quotes.filter((q) => q.status === 'pending');
  }, [quotes]);

  const eventsCompleted = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return quotes.filter(q => {
      if (q.status !== 'delivered') return false;
      const [y, m] = q.updatedAt.split('-');
      return parseInt(y) === currentYear && parseInt(m) === currentMonth;
    }).length;
  }, [quotes]);

  const formatMoney = (n: number) =>
  `${currencySymbol}${n.toLocaleString('es-LA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎈</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>);

  }

  if (!user) return null;

  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  const today = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });
  const userName = profile?.name || profile?.business_name || user.email?.split('@')[0];

  return (
    <div className="relative p-4 md:p-8 space-y-4 md:space-y-6 pb-8 min-h-screen">
      {/* Blurred balloon background */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.12] blur-[2px]"
        style={{
          backgroundImage: `url(${balloonBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Welcome header */}
      <div className="text-center px-2">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Bienvenida a <span className="text-rose-dark">Deco</span>Control
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-base md:text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          Controla lo que ganas en cada decoración
        </p>
      </div>

      {/* === MOBILE: Ganancia → Ingresos/Gastos → Acciones === */}
      <div className="md:hidden space-y-3">
        {/* Ganancia real del mes - big card */}
        <div className={`${balance >= 0 ? 'bg-blue-50/80 border-blue-100' : 'bg-orange-50/80 border-orange-200'} rounded-2xl p-5 border text-center`}>
          <p className="text-sm text-muted-foreground font-medium mb-1">
            {balance >= 0 ? 'Ganancia real del mes' : 'Pérdida del mes'}
          </p>
          <p className={`text-4xl font-extrabold ${balance >= 0 ? 'text-foreground' : 'text-orange-600'}`}>
            {formatMoney(balance)}
          </p>
        </div>

        {/* Ingresos y Gastos side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-profit-high/10 rounded-2xl p-4 border border-profit-high/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-profit-high" />
              <span className="text-xs font-semibold text-profit-high">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-profit-high">{formatMoney(totalIncome)}</p>
          </div>
          <div className="bg-destructive/10 rounded-2xl p-4 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-destructive rotate-180" />
              <span className="text-xs font-semibold text-destructive">Gastos</span>
            </div>
            <p className="text-lg font-bold text-destructive">{formatMoney(totalExpenses)}</p>
          </div>
        </div>

        {/* Eventos realizados */}
        <div className="bg-blue-50/80 border-blue-100 rounded-2xl p-4 border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-foreground">Eventos realizados este mes</span>
          </div>
          <span className="text-2xl font-extrabold text-blue-600">{eventsCompleted}</span>
        </div>

        {/* Acciones Rápidas - 2 col grid */}
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { to: '/calculator', icon: Calculator, label: 'Nueva Cotización', color: 'bg-rose-light text-rose-dark' },
                { to: '/orders', icon: Calendar, label: 'Agenda y Pedidos', color: 'bg-accent/40 text-accent-foreground' },
                { to: '/packages', icon: Package, label: 'Materiales', color: 'bg-secondary text-secondary-foreground' },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
                >
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{label}</span>
                </Link>
              ))}
              <button
                onClick={() => window.location.reload()}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">Actualizar</span>
              </button>
              <Link
                to="/finances"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-accent/30 text-accent-foreground flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">Mi Dinero</span>
              </Link>
              <a
                href="https://chat.whatsapp.com/JkznOdiR8yh3nEYnjiSLKm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
              >
                <div className="w-12 h-12 rounded-full bg-profit-high/15 text-profit-high flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center leading-tight">Comunidad</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === DESKTOP layout === */}
      <div className="hidden md:block space-y-6">
        {/* Acciones Rápidas */}
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {[
            { to: '/calculator', icon: Calculator, label: 'Nueva Cotización', color: 'bg-rose-light text-rose-dark' },
            { to: '/orders', icon: Calendar, label: 'Agenda y Pedidos', color: 'bg-accent/40 text-accent-foreground' },
            { to: '/finances', icon: Wallet, label: 'Mi Dinero', color: 'bg-profit-high/15 text-profit-high' },
            { to: '/packages', icon: Package, label: 'Materiales', color: 'bg-secondary text-secondary-foreground' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-center leading-tight">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => window.location.reload()}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Actualizar</span>
          </button>
          <a
            href="https://chat.whatsapp.com/JkznOdiR8yh3nEYnjiSLKm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
          >
            <div className="w-10 h-10 rounded-xl bg-profit-high/15 text-profit-high flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">Comunidad</span>
          </a>
        </div>

        {/* Resumen del Mes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resumen del Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-profit-high/10 rounded-xl p-4 border border-profit-high/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-profit-high" />
                  <span className="text-xs font-medium text-muted-foreground">Ingresos del mes</span>
                </div>
                <p className="text-xl font-bold text-profit-high">{formatMoney(totalIncome)}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-medium text-muted-foreground">Gastos del mes</span>
                </div>
                <p className="text-xl font-bold text-destructive">{formatMoney(totalExpenses)}</p>
              </div>
              <div className={`${balance >= 0 ? 'bg-profit-medium/10 border-profit-medium/20' : 'bg-orange-50 border-orange-200'} rounded-xl p-4 border`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`w-4 h-4 ${balance >= 0 ? 'text-profit-medium' : 'text-orange-600'}`} />
                  <span className="text-xs font-medium text-muted-foreground">{balance >= 0 ? 'Ganancia' : 'Pérdida'}</span>
                </div>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-profit-medium' : 'text-orange-600'}`}>{formatMoney(balance)}</p>
              </div>
            </div>
            {pendingQuotes.length > 0 && (
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-3 border border-border">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-profit-medium" />
                  <span className="text-sm font-medium">Pagos pendientes</span>
                </div>
                <span className="text-sm font-bold">{pendingQuotes.length} cotizaciones</span>
              </div>
            )}
            <MonthlyCharts transactions={transactions} currencySymbol={currencySymbol} />
          </CardContent>
        </Card>
      </div>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>);

}