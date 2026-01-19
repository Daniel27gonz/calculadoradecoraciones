import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Sparkles, User, PartyPopper, CheckCircle2 } from 'lucide-react';
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
  const { user, approvalStatus, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in and approved
  useEffect(() => {
    if (user && !loading) {
      if (approvalStatus === 'approved') {
        navigate('/');
      } else if (approvalStatus === 'pending' || approvalStatus === 'rejected') {
        navigate('/pending-approval');
      }
    }
  }, [user, approvalStatus, loading, navigate]);

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
        // Navigation will be handled by useEffect based on approval status
      }
    } else {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (!error) {
        setRegistrationSuccess(true);
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

  // Show registration success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card shadow-soft">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Balloon Profit Calculator</span>
            </div>
          </div>

          <Card className="shadow-elevated border-2 border-green-200">
            <CardContent className="pt-8 pb-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-foreground">
                    ¡Registro exitoso! 🎉
                  </h1>
                  <p className="text-lg font-medium text-primary">
                    Tu cuenta ha sido creada
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <p className="text-amber-800 font-medium">
                    Tu cuenta está en revisión
                  </p>
                  <p className="text-amber-700 text-sm">
                    Estamos validando tu acceso. Una vez aprobado, podrás ingresar a la calculadora.
                  </p>
                </div>

                <div className="flex justify-center gap-2 text-3xl">
                  <span className="animate-float">🎈</span>
                  <span className="animate-float" style={{ animationDelay: '0.3s' }}>🎈</span>
                  <span className="animate-float" style={{ animationDelay: '0.6s' }}>🎈</span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setRegistrationSuccess(false);
                    setIsLogin(true);
                    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="w-full"
                >
                  Ir a iniciar sesión
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Hecho con 💕 para decoradoras de globos
          </p>
        </div>

        <div className="fixed top-20 right-10 text-6xl opacity-20 animate-float pointer-events-none hidden md:block">
          🎈
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
            {isLogin ? 'Bienvenida de vuelta' : 'Únete a nuestra comunidad'}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Ingresa a tu cuenta para continuar' 
              : 'Crea tu cuenta y empieza a calcular tus ganancias'}
          </p>
        </div>

        {/* Decorative Banner for Signup */}
        {!isLogin && (
          <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-primary/10 via-pink-100 to-primary/10 rounded-2xl p-4">
            <PartyPopper className="w-6 h-6 text-primary" />
            <span className="text-sm font-medium text-primary">
              ¡Únete a miles de decoradoras exitosas!
            </span>
            <span className="text-2xl">🎈</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-display text-center">
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Ingresa tu correo y contraseña' 
                : 'Completa los campos para registrarte'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre completo</label>
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
                <label className="text-sm font-medium">Correo electrónico</label>
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
                <label className="text-sm font-medium">Contraseña</label>
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
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                )}
              </div>

              {/* Confirm Password - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirmar contraseña</label>
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
                  : isLogin ? 'Iniciar Sesión' : 'Crear mi cuenta'}
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
                  {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
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
      <div className="fixed top-40 left-20 text-5xl opacity-10 animate-float pointer-events-none hidden md:block" style={{ animationDelay: '2s' }}>
        🎉
      </div>
    </div>
  );
}
