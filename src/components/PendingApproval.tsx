import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface PendingApprovalProps {
  status: 'pending' | 'rejected';
}

export function PendingApproval({ status }: PendingApprovalProps) {
  const { signOut, refreshApprovalStatus, user, profile } = useAuth();

  const handleRefresh = async () => {
    await refreshApprovalStatus();
  };

  if (status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <CardTitle className="text-xl text-red-700">Acceso Denegado</CardTitle>
            <CardDescription className="text-red-600">
              Tu solicitud de acceso ha sido rechazada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Lamentablemente, tu cuenta no ha sido aprobada para acceder a la aplicación.
              Si crees que esto es un error, por favor contacta al administrador.
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={signOut} className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <Card className="w-full max-w-md border-yellow-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center animate-pulse">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl text-yellow-700">Cuenta Pendiente de Aprobación</CardTitle>
          <CardDescription className="text-yellow-600">
            Tu cuenta está siendo revisada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">
              {profile?.name || user?.email}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            El administrador debe aprobar tu cuenta antes de que puedas acceder a la aplicación.
            Este proceso puede tomar un poco de tiempo.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button variant="outline" onClick={handleRefresh} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Verificar estado
            </Button>
            <Button variant="ghost" onClick={signOut} className="w-full text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
