import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import balloonBg from '@/assets/balloon-bg.jpg';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import logoFull from '@/assets/logo-decocontrol-full.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CancelledSubscription } from '@/components/CancelledSubscription';
import { PendingApproval } from '@/components/PendingApproval';
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
  const { user, signIn, signUp, loading, isCancelled, isApproved, approvalStatus, isAdmin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{name?: string;email?: string;password?: string;}>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Redirect if already logged in and approved
  useEffect(() => {
    if (user && !loading && isApproved) {
      navigate('/');
    }
  }, [user, loading, isApproved, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate based on form type
    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: {name?: string;email?: string;password?: string;} = {};
      result.error.errors.forEach((err) => {
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
      // Navigation handled by useEffect when approved
    } else {
      const { error } = await signUp(formData.email, formData.password, formData.name);
      // Navigation handled by useEffect when approved
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>);
  }

  // Show cancelled subscription screen at auth level
  if (user && !isAdmin && isCancelled) {
    return <CancelledSubscription />;
  }

  // Show pending approval screen at auth level
  if (user && !isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-12">
      {/* Balloon background */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.15] blur-[2px]"
        style={{
          backgroundImage: `url(${balloonBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }} />
      
      <div className="fixed inset-0 -z-10 bg-background/80" />
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <p className="font-bold text-foreground text-5xl font-serif">Bienvenida a</p>
          <img src={logoFull} alt="DecoControl" className="h-16 mx-auto" />
          

          
          



          
        </div>

        {/* Form Card */}
        <Card className="shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-display text-center">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ?
              'Ingresa tu correo y contraseña' :
              'Completa los campos para crear tu cuenta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* First access info for login */}
            {isLogin &&
            <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg text-center">
                <p className="font-bold text-primary text-base mb-2">🔐 ¿Es tu primer acceso?</p>
                <p className="text-sm text-foreground/80 mb-2">
                  Ingresa con el correo electrónico que utilizaste en la compra y usa la contraseña temporal: <span className="font-semibold">DecoControl2024!</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Luego podrás cambiar tu contraseña fácilmente desde la configuración ⚙️
                </p>
              </div>
            }
            {/* Warning message for registration */}
            {!isLogin &&
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
            }
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name - Only show on signup */}
              {!isLogin &&
              <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10" />
                  
                  </div>
                  {errors.name &&
                <p className="text-sm text-destructive">{errors.name}</p>
                }
                </div>
              }

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
                    className="pl-10" />
                  
                </div>
                {errors.email &&
                <p className="text-sm text-destructive">{errors.email}</p>
                }
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
                    className="pl-10 pr-10" />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password &&
                <p className="text-sm text-destructive">{errors.password}</p>
                }
              </div>

              {/* Submit */}
              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                size="lg"
                disabled={submitting}>
                
                {submitting ?
                'Cargando...' :
                isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ?
                <>
                    ¿Aún no tienes tu acceso?{' '}
                    <a
                    href="https://decocontrol.click/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline">
                    
                      Consíguelo aquí
                    </a>
                  </> :

                <>
                    ¿Ya tienes cuenta?
                    <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrors({});
                      setFormData({ name: '', email: '', password: '' });
                    }}
                    className="ml-1 text-primary font-semibold hover:underline">
                    
                      Inicia sesión
                    </button>
                  </>
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Hecho con 💕 para decoradoras de globos
        </p>
      </div>

    </div>);

}