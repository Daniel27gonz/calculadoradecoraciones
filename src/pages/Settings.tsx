import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Globe, LogOut, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencySelector } from '@/components/CurrencySelector';
import { getCurrencyByCode } from '@/lib/currencies';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleCurrencyChange = (currencyCode: string) => {
    if (user && profile) {
      updateProfile({ currency: currencyCode });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Completa ambos campos');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    }
  };


  const handleSignOut = async () => {
    await signOut();
    // Force navigation to auth page after signing out
    window.location.href = '/auth';
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

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6 overflow-x-hidden">
        {/* User Profile */}
        {user && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-rose-dark" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">Tu cuenta</CardTitle>
                    <CardDescription className="truncate">{user.email}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0 self-start sm:self-center">
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Change Password */}
        {user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cambiar contraseña</CardTitle>
                  <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {changingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
            </CardContent>
          </Card>
        )}

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


        {/* Login prompt for non-authenticated users */}
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
        <div className="text-center text-sm text-muted-foreground py-8 px-2">
          <p className="font-display text-base sm:text-lg font-semibold text-foreground mb-1">
            Calculadora para Decoradoras
          </p>
          <p>Versión 1.0.0</p>
          <p className="mt-2">Hecho con 💕 para decoradoras de globos</p>
        </div>
      </main>
    </div>
  );
}
