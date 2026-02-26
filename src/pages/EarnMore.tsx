import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { TrendingUp } from 'lucide-react';

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
      </div>
    </div>
  );
}
