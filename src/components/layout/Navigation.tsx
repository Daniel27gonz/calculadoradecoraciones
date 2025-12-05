import { Link, useLocation } from 'react-router-dom';
import { Home, Calculator, Package, History, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/calculator', icon: Calculator, label: 'Cotizar' },
  { path: '/packages', icon: Package, label: 'Paquetes' },
  { path: '/history', icon: History, label: 'Historial' },
  { path: '/settings', icon: Settings, label: 'Ajustes' },
];

export function Navigation() {
  const location = useLocation();
  const { mode } = useQuote();
  const { user } = useAuth();

  // Hide navigation on auth page
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-elevated md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo - visible only on desktop */}
        <Link to="/" className="hidden md:flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <Calculator className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Calculadora Para Decoradoras</span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center justify-around w-full md:w-auto md:gap-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-primary bg-rose-light"
                    : "text-muted-foreground hover:text-primary hover:bg-rose-light/50"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs md:text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side - desktop only */}
        <div className="hidden md:flex items-center gap-3">
          {/* Mode indicator */}
          <div className="px-3 py-1.5 rounded-full bg-lavender-light">
            <span className="text-xs font-medium text-accent-foreground">
              {mode === 'beginner' ? '🌸 Principiante' : '⭐ Experto'}
            </span>
          </div>
          
          {/* User indicator */}
          {user ? (
            <Link 
              to="/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-light hover:bg-rose-light/80 transition-colors"
            >
              <User className="w-4 h-4 text-rose-dark" />
              <span className="text-xs font-medium text-rose-dark max-w-[100px] truncate">
                {user.email?.split('@')[0]}
              </span>
            </Link>
          ) : (
            <Link 
              to="/auth"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="text-xs font-medium">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
