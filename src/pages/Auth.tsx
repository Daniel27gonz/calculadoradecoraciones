import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Eye, EyeOff, Mail, Lock, Sparkles, User } from 'lucide-react';
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
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate based on form type
    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: { name?: string; email?: string; password?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(formData.email, formData.password);
      if (!error) {
        navigate('/');
      }
    } else {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      if (!error) {
        navigate('/');
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
            {/* Warning message for registration */}
            {!isLogin && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-red-600 text-sm">
                    <p className="font-bold mb-1">⚠️ ATENCIÓN – LEE ANTES DE REGISTRARTE</p>
                    <p className="mb-2">Regístrate únicamente con el mismo correo que usaste al momento de la compra.</p>
                    <p className="font-semibold">👉 No uses otro correo.</p>
                    <p>Si te registras con uno diferente, el sistema no podrá reconocer tu pago y NO se te dará acceso a la calculadora.</p>
                  </div>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Only show on signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
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
              </div>

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
                    setFormData({ name: '', email: '', password: '' });
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
