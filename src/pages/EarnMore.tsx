import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import checklistImg from '@/assets/checklist-materiales.jpeg';
import respuestasImg from '@/assets/respuestas-rapidas.jpeg';
import guiaErroresImg from '@/assets/guia-errores-comunes.jpeg';
import contratoImg from '@/assets/modelo-contrato.jpeg';

export default function EarnMore() {
  const navigate = useNavigate();
  const { user, isApproved, approvalStatus, isAdmin, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">💰</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-24 md:pb-8">
      <div className="container max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-primary" />
            Gana Más
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consejos y herramientas para aumentar tus ganancias
          </p>
        </div>

        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={checklistImg}
              alt="Checklist de materiales según tipo de decoración"
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="font-display font-semibold text-base leading-tight">
                Checklist de materiales por decoración
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Nunca olvides un material con listas organizadas por tipo de evento.
              </p>
              <Button size="sm" className="mt-2" asChild>
                <a href="https://pay.hotmart.com/O103943521Y?off=hbwm6mdw" target="_blank" rel="noopener noreferrer">Ver detalles</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={respuestasImg}
              alt="100 Respuestas Rápidas para cuando te dicen ¡Está caro!"
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="font-display font-semibold text-base leading-tight">
                100 Respuestas para "¡Está caro!"
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Responde con confianza cuando un cliente cuestione tus precios.
              </p>
              <Button size="sm" className="mt-2" asChild>
                <a href="https://pay.hotmart.com/B104170003H?off=8qdmzx4e" target="_blank" rel="noopener noreferrer">Ver detalles</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={guiaErroresImg}
              alt="Guía para evitar errores comunes en decoraciones con globos"
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="font-display font-semibold text-base leading-tight">
                Guía para evitar errores comunes
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Evita los errores más frecuentes que te hacen perder dinero en tus decoraciones.
              </p>
              <Button size="sm" className="mt-2">
                Ver detalles
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={contratoImg}
              alt="Modelo de contrato para decoradoras de eventos"
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="font-display font-semibold text-base leading-tight">
                Modelo de contrato para eventos
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Protege tu trabajo y evita malentendidos con un contrato profesional.
              </p>
              <Button size="sm" className="mt-2">
                Ver detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
