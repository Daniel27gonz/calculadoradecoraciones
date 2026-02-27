import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import checklistImg from '@/assets/checklist-materiales.jpeg';

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
