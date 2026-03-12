import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { CancelledSubscription } from '@/components/CancelledSubscription';
import { useToast } from '@/hooks/use-toast';
import { PackageFormDialog } from '@/components/packages/PackageFormDialog';
import { Package } from '@/types/quote';

export default function Packages() {
  const navigate = useNavigate();
  const { packages, savePackage, deletePackage } = useQuote();
  const { user, isApproved, approvalStatus, isAdmin, isCancelled, loading } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🎈</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin && isCancelled) {
    return <CancelledSubscription />;
  }
  // Block non-approved users (admins bypass)
  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  const handleUsePackage = (packageId: string) => {
    navigate(`/calculator?package=${packageId}`);
  };

  const handleNewPackage = () => {
    setEditingPackage(null);
    setDialogOpen(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setDialogOpen(true);
  };

  const handleDuplicatePackage = (pkg: Package) => {
    const duplicated: Package = {
      ...pkg,
      id: crypto.randomUUID(),
      name: `${pkg.name} (copia)`,
    };
    savePackage(duplicated);
    toast({
      title: "Paquete duplicado",
      description: `"${duplicated.name}" ha sido creado`,
    });
  };

  const handleSavePackage = (pkg: Package) => {
    savePackage(pkg);
    toast({
      title: editingPackage ? "Paquete actualizado" : "Paquete creado",
      description: `"${pkg.name}" ha sido guardado`,
    });
  };

  const handleDelete = (id: string, name: string) => {
    deletePackage(id);
    toast({
      title: "Paquete eliminado",
      description: `"${name}" ha sido eliminado`,
    });
  };

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
            <h1 className="font-display text-xl font-semibold">Paquetes</h1>
            <Button variant="soft" size="sm" onClick={handleNewPackage}>
              <Plus className="w-4 h-4" />
              Nuevo
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="gradient-hero border-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold mb-1">Plantillas de Paquetes</h2>
                <p className="text-sm text-muted-foreground">
                  Usa estos paquetes predefinidos para crear cotizaciones más rápido. 
                  Cada uno incluye estimados de materiales, globos y tiempo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="group hover:shadow-elevated transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{pkg.icon}</span>
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Package details */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-rose-light/50">
                    <p className="text-lg font-bold text-primary">{pkg.estimatedBalloons}</p>
                    <p className="text-xs text-muted-foreground">Globos</p>
                  </div>
                  <div className="p-2 rounded-lg bg-lavender-light/50">
                    <p className="text-lg font-bold text-accent-foreground">{pkg.estimatedHours}h</p>
                    <p className="text-xs text-muted-foreground">Tiempo</p>
                  </div>
                  <div className="p-2 rounded-lg bg-secondary">
                    <p className="text-lg font-bold text-secondary-foreground">${pkg.suggestedPrice}</p>
                    <p className="text-xs text-muted-foreground">Sugerido</p>
                  </div>
                </div>

                {/* Materials preview */}
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Materiales: </span>
                  {pkg.estimatedMaterials.length > 0 
                    ? pkg.estimatedMaterials.map(m => m.name).join(', ')
                    : 'Sin materiales'}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUsePackage(pkg.id)}
                  >
                    Usar paquete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleEditPackage(pkg)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDuplicatePackage(pkg)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <PackageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        package={editingPackage}
        onSave={handleSavePackage}
      />
    </div>
  );
}
