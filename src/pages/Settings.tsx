import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, User, Globe, LogOut, Palette, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CurrencySelector } from '@/components/CurrencySelector';
import { getCurrencyByCode } from '@/lib/currencies';

export default function Settings() {
  const navigate = useNavigate();
  const { defaultHourlyRate, setDefaultHourlyRate } = useQuote();
  const { user, profile, updateProfile, signOut } = useAuth();
  const { toast } = useToast();

  const handleRateChange = (value: number) => {
    setDefaultHourlyRate(value);
    if (user && profile) {
      updateProfile({ default_hourly_rate: value });
    } else {
      toast({
        title: "Guardado",
        description: "Tu tarifa por hora ha sido actualizada",
      });
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    if (user && profile) {
      updateProfile({ currency: currencyCode });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Configuración</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* User Profile */}
        {user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center">
                  <User className="w-5 h-5 text-rose-dark" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">Tu cuenta</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Moneda</CardTitle>
                <CardDescription>
                  Selecciona la moneda de tu país
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {user ? (
              <CurrencySelector
                value={profile?.currency || 'USD'}
                onChange={handleCurrencyChange}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">
                  Inicia sesión para guardar tu moneda preferida
                </p>
                <Button variant="soft" onClick={() => navigate('/auth')}>
                  Iniciar sesión
                </Button>
              </div>
            )}
            {currentCurrency && user && (
              <p className="mt-3 text-sm text-muted-foreground">
                Moneda actual: {currentCurrency.flag} {currentCurrency.name} ({currentCurrency.symbol})
              </p>
            )}
          </CardContent>
        </Card>

        {/* Default Hourly Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-rose-dark" />
              </div>
              <div>
                <CardTitle className="text-lg">Tarifa por hora</CardTitle>
                <CardDescription>
                  Tu tarifa predeterminada para nuevas cotizaciones
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-2xl text-muted-foreground">
                {currentCurrency?.symbol || '$'}
              </span>
              <Input
                type="number"
                min="0"
                value={defaultHourlyRate ?? ''}
                onChange={(e) => handleRateChange(e.target.value === '' ? 0 : Number(e.target.value))}
                placeholder=""
                className="text-2xl font-bold h-14 w-32"
              />
              <span className="text-muted-foreground">por hora</span>
            </div>
          </CardContent>
        </Card>

        {/* Materials Management */}
        <Card 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate('/materials')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center">
                <Palette className="w-5 h-5 text-rose-dark" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Lista de Materiales</CardTitle>
                <CardDescription>
                  Gestiona tus materiales y precios
                </CardDescription>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>
        {!user && (
          <Card className="border-primary/30 bg-rose-light/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">☁️</div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Sincroniza tus cotizaciones
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea una cuenta para guardar tus cotizaciones en la nube y acceder desde cualquier dispositivo.
              </p>
              <Button variant="gradient" onClick={() => navigate('/auth')}>
                Crear cuenta gratis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p className="font-display text-lg font-semibold text-foreground mb-1">
            Calculadora para Decoradoras
          </p>
          <p>Versión 1.0.0</p>
          <p className="mt-2">Hecho con 💕 para decoradoras de globos</p>
        </div>
      </main>
    </div>
  );
}
