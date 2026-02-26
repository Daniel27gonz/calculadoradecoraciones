import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Wallet, Calendar, Package, TrendingUp, AlertCircle, DollarSign, CreditCard, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import InstallPrompt from '@/components/InstallPrompt';
import FirstLoginInstallPrompt from '@/components/FirstLoginInstallPrompt';
import { PendingApproval } from '@/components/PendingApproval';
import { useEffect, useMemo } from 'react';
import { getCurrencyByCode } from '@/lib/currencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const navigate = useNavigate();
  const { quotes, calculateCosts } = useQuote();
  const { user, profile, loading, isApproved, approvalStatus, isAdmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const currencySymbol = useMemo(() => {
    const currency = getCurrencyByCode(profile?.currency || 'USD');
    return currency?.symbol || '$';
  }, [profile?.currency]);

  const { totalRevenue, totalCosts, profit } = useMemo(() => {
    let revenue = 0;
    let costs = 0;
    quotes.forEach((quote) => {
      const c = calculateCosts(quote);
      revenue += c.finalPrice;
      costs += c.totalCost;
    });
    return { totalRevenue: revenue, totalCosts: costs, profit: revenue - costs };
  }, [quotes, calculateCosts]);


  const pendingQuotes = useMemo(() => {
    return quotes.filter((q) => q.status === 'pending');
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
    <div className="p-4 md:p-8 space-y-6 pb-8">
      {/* Welcome header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Bienvenida a DecoControl
        </h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
          Tu centro de control para tu negocio de decoración
        </p>
      </div>

      {/* Acciones Rápidas - horizontal */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { to: '/calculator', icon: Calculator, label: 'Nueva Cotización', color: 'bg-rose-light text-rose-dark' },
          { to: '/orders', icon: Calendar, label: 'Agenda', color: 'bg-accent/40 text-accent-foreground' },
          { to: '/finances', icon: Wallet, label: 'Finanzas', color: 'bg-profit-high/15 text-profit-high' },
          { to: '/packages', icon: Package, label: 'Inventario', color: 'bg-secondary text-secondary-foreground' },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card min-w-[90px] flex-1"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
          </Link>
        ))}
        <button
          onClick={() => window.location.reload()}
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card min-w-[90px] flex-1"
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
          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card min-w-[90px] flex-1"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-profit-high/10 rounded-xl p-4 border border-profit-high/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-profit-high" />
                <span className="text-xs font-medium text-muted-foreground">Ingresos del mes</span>
              </div>
              <p className="text-xl font-bold text-profit-high">{formatMoney(totalRevenue)}</p>
            </div>
            <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-destructive" />
                <span className="text-xs font-medium text-muted-foreground">Gastos del mes</span>
              </div>
              <p className="text-xl font-bold text-destructive">{formatMoney(totalCosts)}</p>
            </div>
            <div className="bg-profit-medium/10 rounded-xl p-4 border border-profit-medium/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-profit-medium" />
                <span className="text-xs font-medium text-muted-foreground">Ganancia limpia</span>
              </div>
              <p className="text-xl font-bold text-profit-medium">{formatMoney(profit)}</p>
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
        </CardContent>
      </Card>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>);

}