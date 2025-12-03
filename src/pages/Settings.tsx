import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Palette, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuote } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { mode, setMode, defaultHourlyRate, setDefaultHourlyRate } = useQuote();
  const { toast } = useToast();

  const handleRateChange = (value: number) => {
    setDefaultHourlyRate(value);
    toast({
      title: "Guardado",
      description: "Tu tarifa por hora ha sido actualizada",
    });
  };

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
        {/* Mode Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lavender-light flex items-center justify-center">
                <Palette className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Modo de uso</CardTitle>
                <CardDescription>
                  Elige qué tan detallada quieres la interfaz
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('beginner')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'beginner' 
                    ? 'border-primary bg-rose-light/30' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-3xl mb-2">🌸</div>
                <h3 className="font-semibold">Principiante</h3>
                <p className="text-sm text-muted-foreground">
                  Interfaz simple, menos campos, resultados rápidos
                </p>
              </button>
              <button
                onClick={() => setMode('expert')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'expert' 
                    ? 'border-primary bg-rose-light/30' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-3xl mb-2">⭐</div>
                <h3 className="font-semibold">Experto</h3>
                <p className="text-sm text-muted-foreground">
                  Control total, todos los detalles, cálculo avanzado
                </p>
              </button>
            </div>
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
              <span className="text-2xl text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                value={defaultHourlyRate}
                onChange={(e) => handleRateChange(Number(e.target.value))}
                className="text-2xl font-bold h-14 w-32"
              />
              <span className="text-muted-foreground">por hora</span>
            </div>
          </CardContent>
        </Card>

        {/* Profile (placeholder) */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Tu perfil</CardTitle>
                <CardDescription>
                  Logo, nombre de negocio y datos para PDFs
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Próximamente: Configura tu logo y datos de contacto para generar PDFs profesionales.
            </p>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p className="font-display text-lg font-semibold text-foreground mb-1">
            Balloon Profit Calculator
          </p>
          <p>Versión 1.0.0</p>
          <p className="mt-2">Hecho con 💕 para decoradoras de globos</p>
        </div>
      </main>
    </div>
  );
}
