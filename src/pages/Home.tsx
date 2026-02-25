import { Link, useNavigate } from 'react-router-dom';
import { Calculator, Package, History, TrendingUp, Sparkles, MessageCircle, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import InstallPrompt from '@/components/InstallPrompt';
import FirstLoginInstallPrompt from '@/components/FirstLoginInstallPrompt';
import { PendingApproval } from '@/components/PendingApproval';
import { useEffect, useMemo } from 'react';
import { getCurrencyByCode } from '@/lib/currencies';

export default function Home() {
  const navigate = useNavigate();
  const { quotes, calculateCosts } = useQuote();
  const { user, profile, loading, isApproved, approvalStatus, isAdmin } = useAuth();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Obtener el símbolo de moneda del perfil del usuario
  const currencySymbol = useMemo(() => {
    const currency = getCurrencyByCode(profile?.currency || 'USD');
    return currency?.symbol || '$';
  }, [profile?.currency]);

  // Calcular ingresos proyectados usando la misma lógica que calculateCosts
  const totalRevenue = useMemo(() => {
    return quotes.reduce((sum, quote) => {
      const costs = calculateCosts(quote);
      return sum + costs.finalPrice;
    }, 0);
  }, [quotes, calculateCosts]);

  const features = [
  {
    icon: Calculator,
    title: 'Nueva Cotización',
    description: 'Calcula costos y precios de tu evento',
    href: '/calculator',
    color: 'bg-rose-light text-rose-dark'
  },
  {
    icon: Package,
    title: 'Paquetes',
    description: 'Plantillas predefinidas para agilizar',
    href: '/packages',
    color: 'bg-lavender-light text-accent-foreground'
  },
  {
    icon: History,
    title: 'Historial',
    description: `${quotes.length} cotizaciones guardadas`,
    href: '/history',
    color: 'bg-secondary text-secondary-foreground'
  }];


  // Show loading or nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎈</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>);

  }

  if (!user) {
    return null;
  }

  // Show pending approval screen for non-approved users (admins bypass this)
  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Hero Section - Full Screen */}
      <section className="gradient-hero min-h-screen flex items-center justify-center px-4">
        <div className="container max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Calculadora para decoradoras</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            Calculadora para
            <span className="text-gradient block">Decoradoras de Globos</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Calcula el precio perfecto para tus decoraciones, 
            visualiza tu ganancia y envía cotizaciones profesionales en minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild variant="gradient" size="xl">
              



            </Button>
            <Button asChild
            variant="outline"
            size="default"
            className="w-full sm:w-auto text-xs sm:text-base px-3 sm:px-6 py-2 sm:py-3 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950">

              <a
                href="/whatsapp-redirect.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2">

                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Únete a nuestra Comunidad Privada 🎀</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="default" className="w-full sm:w-auto">
              <Link to="/finances" className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Finanzas 💰</span>
              </Link>
            </Button>
            <Button
              variant="soft"
              size="default"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto">

              <RefreshCw className="w-4 h-4" />
              Actualizar
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            ¡Hola, {profile?.name || profile?.business_name || user.email?.split('@')[0]}! 👋
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      {quotes.length > 0 &&
      <section className="container max-w-4xl mx-auto px-4 mt-8">
          <Card elevated>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos proyectados</p>
                  <p className="text-2xl font-bold">{currencySymbol}{totalRevenue.toLocaleString('es-LA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      }

      {/* Features Grid */}
      <section className="container max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, href, color }) =>
          <Link key={href} to={href}>
              <Card className="h-full hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </section>

      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 text-6xl opacity-20 animate-float pointer-events-none hidden md:block">
        🎈
      </div>
      <div className="fixed bottom-32 left-10 text-4xl opacity-15 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1s' }}>
        🎀
      </div>

      <InstallPrompt />
      <FirstLoginInstallPrompt />
    </div>);

}