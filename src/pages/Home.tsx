import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Wallet, Calendar, Package, TrendingUp, DollarSign, CreditCard, Users, RefreshCw, Clock, FileText, CheckCircle, CalendarCheck } from 'lucide-react';
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

export default function Home() {
  const navigate = useNavigate();
  const { quotes } = useQuote();
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

    return { totalIncome: income, totalExpenses: realTotalExpenses, balance: income - realTotalExpenses };
  }, [transactions, realTotalExpenses]);

  // Activity stats
  const { eventsCompleted, quotesCreated, upcomingEvents } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const todayStr = format(now, 'yyyy-MM-dd');

    const delivered = quotes.filter(q => {
      if (q.status !== 'delivered') return false;
      return q.eventDate?.startsWith(prefix);
    }).length;

    const created = quotes.filter(q => q.createdAt?.startsWith(prefix)).length;

    const upcoming = quotes.filter(q => {
      if (q.status === 'cancelled' || q.status === 'delivered') return false;
      if (!q.eventDate) return false;
      return q.eventDate >= todayStr && q.status === 'approved';
    }).length;

    return { eventsCompleted: delivered, quotesCreated: created, upcomingEvents: upcoming };
  }, [quotes]);

  // Next event
  const nextEvent = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    const future = quotes
      .filter(q => {
        if (q.status === 'cancelled' || q.status === 'delivered') return false;
        if (!q.eventDate) return false;
        return q.eventDate >= todayStr && q.status === 'approved';
      })
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));

    if (future.length === 0) return null;

    const q = future[0];
    const eventDateObj = q.eventDate ? new Date(q.eventDate + 'T12:00:00') : null;

    return {
      clientName: q.clientName,
      eventType: q.eventType || q.decorationDescription || 'Decoración',
      eventDate: eventDateObj ? format(eventDateObj, "d 'de' MMMM, yyyy", { locale: es }) : '',
      setupTime: q.setupTime || null,
    };
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
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  const userName = profile?.name || profile?.business_name || user.email?.split('@')[0];
  const currentMonthLabel = format(new Date(), "MMMM yyyy", { locale: es });

  // Shared quick actions
  const quickActions = [
    { to: '/calculator', icon: Calculator, label: 'Nueva Cotización', color: 'bg-rose-light text-rose-dark' },
    { to: '/orders', icon: Calendar, label: 'Agenda y Pedidos', color: 'bg-accent/40 text-accent-foreground' },
    { to: '/finances', icon: Wallet, label: 'Mi Dinero', color: 'bg-profit-high/15 text-profit-high' },
    { to: '/packages', icon: Package, label: 'Materiales', color: 'bg-secondary text-secondary-foreground' },
  ];

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

      {/* === MOBILE LAYOUT === */}
      <div className="md:hidden space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
            >
              <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => window.location.reload()}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
          >
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">Actualizar</span>
          </button>
          <a
            href="https://chat.whatsapp.com/JkznOdiR8yh3nEYnjiSLKm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card"
          >
            <div className="w-10 h-10 rounded-full bg-profit-high/15 text-profit-high flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium text-center leading-tight">Comunidad</span>
          </a>
        </div>

        {/* Resumen del Mes */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Resumen del Mes
              <span className="text-xs font-normal text-muted-foreground capitalize">· {currentMonthLabel}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* Balance big */}
            <div className={`${balance >= 0 ? 'bg-blue-50/80 border-blue-100' : 'bg-orange-50/80 border-orange-200'} rounded-xl p-4 border text-center`}>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                {balance >= 0 ? 'Ganancia del mes' : 'Pérdida del mes'}
              </p>
              <p className={`text-3xl font-extrabold ${balance >= 0 ? 'text-foreground' : 'text-orange-600'}`}>
                {formatMoney(balance)}
              </p>
            </div>
            {/* Income / Expenses */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-profit-high/10 rounded-xl p-3 border border-profit-high/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-profit-high" />
                  <span className="text-[10px] font-semibold text-profit-high">Ingresos</span>
                </div>
                <p className="text-base font-bold text-profit-high">{formatMoney(totalIncome)}</p>
              </div>
              <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/20">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CreditCard className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-[10px] font-semibold text-destructive">Gastos</span>
                </div>
                <p className="text-base font-bold text-destructive">{formatMoney(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actividad del Mes */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-muted-foreground" />
              Actividad del Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-100 text-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-emerald-700">{eventsCompleted}</p>
                <p className="text-[10px] text-emerald-600 font-medium leading-tight">Eventos realizados</p>
              </div>
              <div className="bg-purple-50/80 rounded-xl p-3 border border-purple-100 text-center">
                <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-purple-700">{quotesCreated}</p>
                <p className="text-[10px] text-purple-600 font-medium leading-tight">Cotizaciones creadas</p>
              </div>
              <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-100 text-center">
                <Calendar className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-2xl font-extrabold text-amber-700">{upcomingEvents}</p>
                <p className="text-[10px] text-amber-600 font-medium leading-tight">Eventos en agenda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximo Evento */}
        {nextEvent && (
          <Card className="rounded-2xl border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-card">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-dark" />
                Próximo Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-1.5">
                <p className="font-bold text-base text-foreground">{nextEvent.eventType}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="capitalize">{nextEvent.eventDate}</span>
                </div>
                {nextEvent.setupTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{nextEvent.setupTime} hrs</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>Cliente: {nextEvent.clientName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* === DESKTOP LAYOUT === */}
      <div className="hidden md:block space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-6 gap-3">
          {quickActions.map(({ to, icon: Icon, label, color }) => (
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
            <CardTitle className="text-lg flex items-center gap-2">
              Resumen del Mes
              <span className="text-sm font-normal text-muted-foreground capitalize">· {currentMonthLabel}</span>
            </CardTitle>
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
          </CardContent>
        </Card>

        {/* Actividad del Mes + Próximo Evento side by side */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-muted-foreground" />
                Actividad del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-100 text-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-emerald-700">{eventsCompleted}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Eventos realizados</p>
                </div>
                <div className="bg-purple-50/80 rounded-xl p-4 border border-purple-100 text-center">
                  <FileText className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-purple-700">{quotesCreated}</p>
                  <p className="text-xs text-purple-600 font-medium mt-1">Cotizaciones creadas</p>
                </div>
                <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-100 text-center">
                  <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-3xl font-extrabold text-amber-700">{upcomingEvents}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Eventos en agenda</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/30 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-dark" />
                Próximo Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextEvent ? (
                <div className="space-y-3">
                  <p className="font-bold text-xl text-foreground">{nextEvent.eventType}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="capitalize">{nextEvent.eventDate}</span>
                    </div>
                    {nextEvent.setupTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{nextEvent.setupTime} hrs</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Cliente: {nextEvent.clientName}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No hay eventos próximos</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>
  );
}
