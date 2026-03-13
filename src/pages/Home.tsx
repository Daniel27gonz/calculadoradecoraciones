import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Wallet, Calendar, Package, TrendingUp, DollarSign, CreditCard, Users, RefreshCw, Clock, FileText, CheckCircle, CalendarCheck, ShoppingBag, Receipt } from 'lucide-react';
import balloonBg from '@/assets/balloon-bg.jpg';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import InstallPrompt from '@/components/InstallPrompt';
import FirstLoginInstallPrompt from '@/components/FirstLoginInstallPrompt';
import { PendingApproval } from '@/components/PendingApproval';
import { CancelledSubscription } from '@/components/CancelledSubscription';
import { useMemo } from 'react';
import { getCurrencyByCode } from '@/lib/currencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFinancialData, useMonthlyFinancials } from '@/hooks/useFinancialData';

export default function Home() {
  const navigate = useNavigate();
  const { quotes } = useQuote();
  const { user, profile, loading, isApproved, approvalStatus, isAdmin, isCancelled } = useAuth();

  const { transactions: allTransactions } = useFinancialData();

  const now = new Date();
  const { totalIncome, totalExpenses, totalMaterialPurchases, totalIndirectExpenses, totalInvestments, balance } = useMonthlyFinancials(allTransactions, now.getMonth(), now.getFullYear());

  const currencySymbol = useMemo(() => {
    const currency = getCurrencyByCode(profile?.currency || 'USD');
    return currency?.symbol || '$';
  }, [profile?.currency]);

  // Activity stats
  const { eventsCompleted, quotesCreated, upcomingEvents } = useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const todayStr = format(now, 'yyyy-MM-dd');

    const delivered = quotes.filter(q => q.status === 'delivered' && q.eventDate?.startsWith(prefix)).length;
    const created = quotes.filter(q => q.createdAt?.startsWith(prefix)).length;
    const upcoming = quotes.filter(q =>
      q.status === 'approved' && q.eventDate && q.eventDate >= todayStr
    ).length;

    return { eventsCompleted: delivered, quotesCreated: created, upcomingEvents: upcoming };
  }, [quotes]);

  // Next event
  const nextEvent = useMemo(() => {
    const todayStr = format(now, 'yyyy-MM-dd');
    const future = quotes
      .filter(q => q.status === 'approved' && q.eventDate && q.eventDate >= todayStr)
      .sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));

    if (future.length === 0) return null;
    const q = future[0];
    const eventDateObj = q.eventDate ? new Date(q.eventDate + 'T12:00:00') : null;
    return {
      clientName: q.clientName,
      eventType: q.eventType || q.decorationDescription || '',
      eventDate: eventDateObj ? format(eventDateObj, "d 'de' MMMM, yyyy", { locale: es }) : '',
      setupTime: q.setupTime || null,
    };
  }, [quotes]);

  const formatMoney = (n: number) =>
    `${currencySymbol}${n.toLocaleString('es-LA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  const userName = profile?.name || profile?.business_name || user.email?.split('@')[0];
  const currentMonthLabel = format(new Date(), "MMMM yyyy", { locale: es });

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
                <p className="text-[10px] text-emerald-600 font-medium leading-tight">Decoraciones realizadas</p>
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
              <div className={`rounded-xl p-4 border ${balance >= 0 ? 'bg-blue-50/80 border-blue-200' : 'bg-orange-50/80 border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className={`w-4 h-4 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {balance >= 0 ? 'Ganancia' : 'Pérdida'}
                  </span>
                </div>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                  {formatMoney(balance)}
                </p>
              </div>
            </div>

            {/* Activity row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-100 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-lg font-bold text-emerald-700">{eventsCompleted}</p>
                  <p className="text-xs text-emerald-600">Decoraciones realizadas</p>
                </div>
              </div>
              <div className="bg-purple-50/80 rounded-xl p-3 border border-purple-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-lg font-bold text-purple-700">{quotesCreated}</p>
                  <p className="text-xs text-purple-600">Cotizaciones creadas</p>
                </div>
              </div>
              <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-100 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-lg font-bold text-amber-700">{upcomingEvents}</p>
                  <p className="text-xs text-amber-600">Eventos en agenda</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximo Evento */}
        {nextEvent && (
          <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-dark" />
                Próximo Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <p className="font-bold text-foreground">{nextEvent.eventType}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="capitalize">{nextEvent.eventDate}</span>
                </div>
                {nextEvent.setupTime && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{nextEvent.setupTime} hrs</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{nextEvent.clientName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>
  );
}
