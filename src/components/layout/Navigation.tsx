import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoDecocontrol from '@/assets/logo-decocontrol.png';
import { Home, Calculator, Package, History, Settings, User, Wallet, Calendar, LogOut, Menu, X, ChevronRight, FilePlus, PackageOpen, Droplets, Wrench, FileDown, Database, Receipt, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type SidebarItem = {
  path?: string;
  icon: any;
  label: string;
  submenu?: {path: string;icon: any;label: string;}[];
};

const sidebarItems: SidebarItem[] = [
{ path: '/', icon: Home, label: 'Inicio' },
{
  icon: Calculator,
  label: 'Calcular',
  submenu: [
  { path: '/indirect-expenses', icon: Receipt, label: 'Gastos del Mes' },
  { path: '/calculator', icon: FilePlus, label: 'Nueva Cotización' },
  { path: '/packages', icon: PackageOpen, label: 'Paquete' }]

},
{
  icon: Package,
  label: 'Materiales',
  submenu: [
  { path: '/inventory/consumables', icon: Droplets, label: 'Materiales de Consumo' },
  { path: '/inventory/reusables', icon: Wrench, label: 'Material Reutilizable' }]

},
{ path: '/history', icon: History, label: 'Historial' },
{ path: '/design', icon: FileDown, label: 'Cotización (PDF)' },
{ path: '/finances', icon: Wallet, label: 'Mi Dinero' },
{ path: '/orders', icon: Calendar, label: 'Agenda y Pedidos' },
{ path: '/earn-more', icon: TrendingUp, label: 'Gana Más' }];


const bottomItems = [
{ path: '/settings', icon: Settings, label: 'Configuración' }];


export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  if (location.pathname === '/auth') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () =>
  <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 pb-4 flex justify-center">
        <img src={logoDecocontrol} alt="DecoControl" className="h-12 object-contain" />

      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        {sidebarItems.map((item) => {
        const { icon: Icon, label, submenu, path } = item;

        if (submenu) {
          const isSubActive = submenu.some((s) => location.pathname === s.path);
          return (
            <div key={label}>
                <button
                onClick={() => setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full",
                  isSubActive ?
                  "bg-rose-light text-primary shadow-sm" :
                  "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}>

                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{label}</span>
                  <ChevronRight className={cn("w-4 h-4 ml-auto transition-transform duration-200", openMenus[label] && "rotate-90")} />
                </button>
                {openMenus[label] &&
              <div className="ml-4 mt-1 space-y-1">
                    {submenu.map(({ path: subPath, icon: SubIcon, label: subLabel }) => {
                  const isActive = location.pathname === subPath;
                  return (
                    <Link
                      key={subPath}
                      to={subPath}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive ?
                        "bg-rose-light text-primary" :
                        "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}>

                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{subLabel}</span>
                        </Link>);

                })}
                  </div>
              }
              </div>);

        }

        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path!}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive ?
              "bg-rose-light text-primary shadow-sm" :
              "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}>

              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </Link>);

      })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-1 border-t border-border pt-3 mt-2">
        {isAdmin && (
          <Link
            to="/admin/database"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              location.pathname === '/admin/database' ?
              "bg-rose-light text-primary shadow-sm" :
              "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <span>Database</span>
            </Link>
        )}
        {bottomItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive ?
              "bg-rose-light text-primary shadow-sm" :
              "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>);
      })}
        <button
        onClick={() => {handleSignOut();setMobileOpen(false);}}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 w-full">

          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>;


  // Mobile: hamburger + drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile top bar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border h-14 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <Menu className="w-6 h-6 text-foreground" />
          </button>
          <img src={logoDecocontrol} alt="DecoControl" className="h-8 object-contain flex-1" />
          {user &&
          <Link to="/settings" className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-rose-light">
              <User className="w-4 h-4 text-rose-dark" />
              <span className="text-xs font-medium text-rose-dark max-w-[100px] truncate">
                {profile?.name || user.email?.split('@')[0]}
              </span>
            </Link>
          }
        </div>

        {/* Drawer overlay */}
        {mobileOpen &&
        <div className="fixed inset-0 z-[60] flex">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 bg-card border-r border-border shadow-elevated animate-slide-in-left z-10">
              <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors">

                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <NavContent />
            </div>
          </div>
        }
      </>);

  }

  // Desktop: fixed sidebar
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border z-40 shadow-sm">
      <NavContent />
    </aside>);

}