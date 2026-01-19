import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Sparkles, User, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Por favor ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Por favor ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading, approvalStatus, checkApprovalStatus } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check approval status periodically when user is pending
  useEffect(() => {
    if (user && approvalStatus === 'pending') {
      const interval = setInterval(() => {
        checkApprovalStatus();
      }, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [user, approvalStatus, checkApprovalStatus]);

  // Redirect if approved
  useEffect(() => {
    if (user && !loading && approvalStatus === 'approved') {
      navigate('/');
    }
  }, [user, loading, approvalStatus, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate based on form type
    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password);
      if (!error) {
        // Will be handled by useEffect based on approval status
      }
    } else {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (!error) {
        setRegistrationComplete(true);
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Pending approval screen
  if (user && approvalStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">En Revisión</span>
            </div>
          </div>

          <Card className="shadow-elevated">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-amber-100 dark:bg-amber-900/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-amber-50 dark:bg-amber-900/50 flex items-center justify-center">
                  <Clock className="w-10 h-10 text-amber-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold">Tu cuenta está en revisión 🎈</h2>
                <p className="text-muted-foreground">
                  Estamos validando tu acceso. Una vez aprobado, podrás ingresar a la calculadora.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Este proceso puede tomar algunas horas. Te notificaremos cuando tu cuenta esté lista.
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => {
                  checkApprovalStatus();
                }}
                className="w-full"
              >
                Verificar estado
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Hecho con 💕 para decoradoras de globos
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="fixed top-20 right-10 text-6xl opacity-20 animate-float pointer-events-none hidden md:block">
          🎈
        </div>
        <div className="fixed bottom-32 left-10 text-4xl opacity-15 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '1s' }}>
          ⏳
        </div>
      </div>
    );
  }

  // Rejected screen
  if (user && approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <Card className="shadow-elevated">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/30" />
                <div className="absolute inset-2 rounded-full bg-red-50 dark:bg-red-900/50 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold">Acceso no autorizado</h2>
                <p className="text-muted-foreground">
                  Lo sentimos, tu solicitud de acceso no ha sido aprobada.
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={async () => {
                  const { signOut } = useAuth();
                  await signOut();
                }}
                className="w-full"
              >
                Cerrar sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Registration complete screen (before email verification)
  if (registrationComplete && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Registro Exitoso</span>
            </div>
          </div>

          <Card className="shadow-elevated">
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl">🎈</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-bold">¡Registro completado!</h2>
                <p className="text-muted-foreground">
                  Tu cuenta ha sido creada. Ahora está pendiente de aprobación por el administrador.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">¿Qué sigue?</p>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>1. Revisaremos tu solicitud de acceso</li>
                  <li>2. Una vez aprobada, podrás iniciar sesión</li>
                  <li>3. ¡Y comenzar a calcular tus ganancias!</li>
                </ul>
              </div>

              <Button 
                variant="gradient" 
                onClick={() => {
                  setRegistrationComplete(false);
                  setIsLogin(true);
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                }}
                className="w-full"
              >
                Ir a iniciar sesión
              </Button>
            </CardContent>
          </Card>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Balloon Profit Calculator</span>
          </div>
          <h1 className="font-display text-3xl font-bold">
            {isLogin ? 'Bienvenida de vuelta' : 'Crea tu cuenta'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Ingresa a tu cuenta para continuar' 
              : 'Empieza a calcular tus ganancias hoy'}
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-display text-center">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Ingresa tu correo y contraseña' 
                : 'Completa los campos para crear tu cuenta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Tu nombre"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Submit */}
              <Button 
                type="submit" 
                variant="gradient" 
                className="w-full" 
                size="lg"
                disabled={submitting}
              >
                {submitting 
                  ? 'Cargando...' 
                  : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="ml-1 text-primary font-semibold hover:underline"
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
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
    </div>
  );
}
