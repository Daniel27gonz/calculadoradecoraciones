import { Clock, Mail, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Balloon Profit Calculator</span>
          </div>
        </div>

        {/* Pending Card */}
        <Card className="shadow-elevated border-2 border-primary/20">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Animated Icon */}
              <div className="relative inline-flex">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Clock className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                  <span className="text-xs">⏳</span>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  ¡Hola{profile?.name ? `, ${profile.name}` : ''}! 👋
                </h1>
                <p className="text-lg font-medium text-primary">
                  Tu cuenta está en revisión
                </p>
              </div>

              {/* Description */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <p className="text-muted-foreground">
                  Estamos validando tu acceso a la calculadora. Una vez aprobado, 
                  podrás ingresar y comenzar a calcular tus cotizaciones.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>Te notificaremos cuando tu cuenta esté lista</span>
                </div>
              </div>

              {/* Decorative Balloons */}
              <div className="flex justify-center gap-2 text-3xl opacity-50">
                <span className="animate-float">🎈</span>
                <span className="animate-float" style={{ animationDelay: '0.5s' }}>🎈</span>
                <span className="animate-float" style={{ animationDelay: '1s' }}>🎈</span>
              </div>

              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                onClick={signOut}
                className="w-full"
              >
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Hecho con 💕 para decoradoras de globos
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-20 right-10 text-6xl opacity-20 animate-float pointer-events-none hidden md:block">
        🎈
      </div>
      <div className="fixed bottom-32 left-10 text-4xl opacity-15 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1s' }}>
        🎀
      </div>
      <div className="fixed top-40 left-20 text-5xl opacity-10 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '2s' }}>
        🎉
      </div>
    </div>
  );
}
