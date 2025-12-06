import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smartphone, Monitor, Share, MoreVertical, PlusSquare, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Install() {
  const navigate = useNavigate();

  const iphoneSteps = [
    {
      icon: <Share className="h-6 w-6" />,
      title: "Abre Safari",
      description: "Visita esta página desde el navegador Safari"
    },
    {
      icon: <Share className="h-6 w-6" />,
      title: "Toca el botón Compartir",
      description: "Está en la parte inferior de la pantalla (ícono de cuadrado con flecha)"
    },
    {
      icon: <PlusSquare className="h-6 w-6" />,
      title: 'Selecciona "Añadir a pantalla de inicio"',
      description: "Desliza hacia abajo en el menú hasta encontrar esta opción"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: 'Toca "Añadir"',
      description: "¡Listo! La app aparecerá en tu pantalla de inicio"
    }
  ];

  const androidSteps = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Abre Chrome",
      description: "Visita esta página desde el navegador Chrome"
    },
    {
      icon: <MoreVertical className="h-6 w-6" />,
      title: "Toca el menú (⋮)",
      description: "Está en la esquina superior derecha"
    },
    {
      icon: <PlusSquare className="h-6 w-6" />,
      title: '"Añadir a pantalla de inicio"',
      description: "Selecciona esta opción del menú"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: 'Confirma "Añadir"',
      description: "¡Listo! La app aparecerá en tu pantalla de inicio"
    }
  ];

  const desktopSteps = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: "Abre Chrome, Edge o Safari",
      description: "Visita esta página desde tu navegador favorito"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Busca el ícono de instalación",
      description: "En Chrome/Edge aparece en la barra de direcciones (ícono de monitor con flecha)"
    },
    {
      icon: <PlusSquare className="h-6 w-6" />,
      title: 'Haz clic en "Instalar"',
      description: "Confirma la instalación en el diálogo que aparece"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "¡App instalada!",
      description: "Encontrarás la app en tu escritorio o menú de aplicaciones"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 pt-4">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Instalar la App
            </h1>
            <p className="text-sm text-muted-foreground">
              Accede más rápido desde tu dispositivo
            </p>
          </div>
        </div>

        {/* Benefits */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✨</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">¿Por qué instalar?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Acceso rápido desde tu pantalla de inicio</li>
                  <li>• Funciona sin conexión a internet</li>
                  <li>• Experiencia de app nativa</li>
                  <li>• Sin ocupar espacio de almacenamiento</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* iPhone Instructions */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-2 rounded-xl">
                <span className="text-white text-xl">🍎</span>
              </div>
              iPhone / iPad
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {iphoneSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-medium text-foreground text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Android Instructions */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2 rounded-xl">
                <span className="text-white text-xl">🤖</span>
              </div>
              Android
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {androidSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-medium text-foreground text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Desktop Instructions */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl">
                <Monitor className="h-5 w-5 text-white" />
              </div>
              Computadora
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {desktopSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-medium text-foreground text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Help Note */}
        <div className="text-center text-sm text-muted-foreground mt-6">
          <p>¿Necesitas ayuda? 💬</p>
          <p>Escríbenos y te guiamos paso a paso</p>
        </div>
      </div>
    </div>
  );
}
