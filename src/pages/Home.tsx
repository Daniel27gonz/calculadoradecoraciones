import { Link } from 'react-router-dom';
import { Calculator, Package, History, TrendingUp, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { quotes, mode, setMode } = useQuote();
  const { user, profile } = useAuth();
  
  const totalRevenue = quotes.reduce((sum, q) => {
    const costs = q.balloons.reduce((s, b) => s + b.pricePerUnit * b.quantity, 0) +
                  q.materials.reduce((s, m) => s + m.costPerUnit * m.quantity, 0) +
                  q.extras.reduce((s, e) => s + e.cost, 0);
    return sum + costs * (1 + q.marginPercentage / 100);
  }, 0);

  const features = [
    {
      icon: Calculator,
      title: 'Nueva Cotización',
      description: 'Calcula costos y precios de tu evento',
      href: '/calculator',
      color: 'bg-rose-light text-rose-dark',
    },
    {
      icon: Package,
      title: 'Paquetes',
      description: 'Plantillas predefinidas para agilizar',
      href: '/packages',
      color: 'bg-lavender-light text-accent-foreground',
    },
    {
      icon: History,
      title: 'Historial',
      description: `${quotes.length} cotizaciones guardadas`,
      href: '/history',
      color: 'bg-secondary text-secondary-foreground',
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      {/* Hero Section */}
      <section className="gradient-hero py-12 px-4">
        <div className="container max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Calculadora para decoradoras</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Calculadora para
            <span className="text-gradient block">Decoradoras de Globos</span>
          </h1>
          
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Calcula el precio perfecto para tus decoraciones, 
            visualiza tu ganancia y envía cotizaciones profesionales en minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="gradient" size="xl">
              <Link to="/calculator">
                <Calculator className="w-5 h-5" />
                Crear Cotización
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">
                  <User className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>

          {user && (
            <p className="text-sm text-muted-foreground">
              ¡Hola, {profile?.business_name || user.email}! 👋
            </p>
          )}
        </div>
      </section>

      {/* Mode Toggle */}
      <section className="container max-w-4xl mx-auto px-4 -mt-6">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Modo de uso</p>
                <p className="text-sm text-muted-foreground">
                  {mode === 'beginner' 
                    ? 'Interfaz simplificada para empezar rápido' 
                    : 'Control total sobre todos los detalles'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={mode === 'beginner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('beginner')}
                >
                  🌸 Principiante
                </Button>
                <Button
                  variant={mode === 'expert' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('expert')}
                >
                  ⭐ Experto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick Stats */}
      {quotes.length > 0 && (
        <section className="container max-w-4xl mx-auto px-4 mt-8">
          <Card elevated>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos proyectados</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Features Grid */}
      <section className="container max-w-4xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description, href, color }) => (
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
          ))}
        </div>
      </section>

      {/* Cloud Sync Promo for non-authenticated users */}
      {!user && (
        <section className="container max-w-4xl mx-auto px-4 mt-8">
          <Card className="border-primary/30 bg-rose-light/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-5xl">☁️</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-display text-lg font-semibold mb-1">
                    Sincroniza tus cotizaciones
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Crea una cuenta gratis para guardar tus cotizaciones en la nube y acceder desde cualquier dispositivo.
                  </p>
                </div>
                <Button variant="gradient" asChild>
                  <Link to="/auth">Crear cuenta</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 text-6xl opacity-20 animate-float pointer-events-none hidden md:block">
        🎈
      </div>
      <div className="fixed bottom-32 left-10 text-4xl opacity-15 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1s' }}>
        🎀
      </div>
    </div>
  );
}
