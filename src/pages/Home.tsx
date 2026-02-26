import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Wallet, Calendar, Package, TrendingUp, AlertCircle, DollarSign, CreditCard, Users } from 'lucide-react';
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

  // Get upcoming events from quotes with event_date
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return quotes.
    filter((q) => q.eventDate && new Date(q.eventDate) >= now).
    sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).
    slice(0, 4);
  }, [quotes]);

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
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Bienvenida a Deco Control
        </h1>
        <p className="text-muted-foreground mt-1">
          Tu centro de control para tu negocio de decoración
        </p>
        


      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT: Resumen del Mes + Alertas (span 2) */}
        


















































































        {/* RIGHT: Próximos Eventos + Acciones Rápidas */}
        <div className="space-y-5">

          {/* Próximos Eventos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ?
              <div className="space-y-3">
                  {upcomingEvents.map((event) => {
                  const costs = calculateCosts(event);
                  return (
                    <div key={event.id} className="flex items-start justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent/40 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {format(new Date(event.eventDate), 'dd')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{event.clientName}</p>
                            <p className="text-xs text-muted-foreground">{event.eventType || 'Evento'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatMoney(costs.finalPrice)}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        event.status === 'approved' ? 'bg-profit-high/15 text-profit-high' : 'bg-profit-medium/15 text-profit-medium'}`
                        }>
                            {event.status === 'approved' ? '✔ Confirmado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>);

                })}
                </div> :

              <p className="text-sm text-muted-foreground italic">No hay eventos próximos.</p>
              }
              <Link
                to="/orders"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">

                Ver Agenda →
              </Link>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                { to: '/calculator', icon: Calculator, label: 'Nueva Cotización', color: 'bg-rose-light text-rose-dark' },
                { to: '/orders', icon: Calendar, label: 'Ver Agenda', color: 'bg-accent/40 text-accent-foreground' },
                { to: '/finances', icon: Wallet, label: 'Ver Finanzas', color: 'bg-profit-high/15 text-profit-high' },
                { to: '/packages', icon: Package, label: 'Inventario', color: 'bg-secondary text-secondary-foreground' }].
                map(({ to, icon: Icon, label, color }) =>
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:shadow-soft hover:scale-[1.02] transition-all duration-200 bg-card">

                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{label}</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>);

}