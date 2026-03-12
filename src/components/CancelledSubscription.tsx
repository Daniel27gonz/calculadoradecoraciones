import { LogOut, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function CancelledSubscription() {
  const { signOut, refreshApprovalStatus, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <Card className="w-full max-w-md border-orange-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <CardTitle className="text-xl text-orange-700">Suscripción Cancelada</CardTitle>
          <CardDescription className="text-orange-600">
            Tu acceso a DecoControl ha sido suspendido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-sm text-orange-800 font-medium">
              {user?.email}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu suscripción fue cancelada o reembolsada. Para volver a acceder a todas las funciones de DecoControl, 
            necesitas renovar tu suscripción.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => window.open('https://decocontrol.click/', '_blank')}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Renovar suscripción
            </Button>
            <Button variant="outline" onClick={refreshApprovalStatus} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ya renové, verificar acceso
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