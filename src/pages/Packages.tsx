import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useToast } from '@/hooks/use-toast';
import { PackageFormModal } from '@/components/packages/PackageFormModal';
import { Package } from '@/types/quote';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Packages() {
  const navigate = useNavigate();
  const { packages, deletePackage, savePackage, duplicatePackage } = useQuote();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleUsePackage = (packageId: string) => {
    navigate(`/calculator?package=${packageId}`);
  };

  const handleAddNew = () => {
    setEditingPackage(null);
    setIsFormOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (id: string, name: string) => {
    try {
      await duplicatePackage(id);
      toast({
        title: "Paquete duplicado",
        description: `"${name}" ha sido duplicado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar el paquete",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setPackageToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    
    try {
      await deletePackage(packageToDelete.id);
      toast({
        title: "Paquete eliminado",
        description: `"${packageToDelete.name}" ha sido eliminado`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el paquete",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    }
  };

  const handleSavePackage = async (pkg: Package) => {
    try {
      await savePackage(pkg);
      toast({
        title: editingPackage ? "Paquete actualizado" : "Paquete creado",
        description: `"${pkg.name}" ha sido ${editingPackage ? 'actualizado' : 'creado'}`,
      });
    } catch (error) {
      // Error already handled in context
    }
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
            <Button variant="soft" size="sm" onClick={handleAddNew}>
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
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDuplicate(pkg.id, pkg.name)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(pkg.id, pkg.name)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {packages.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No tienes paquetes creados</p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer paquete
            </Button>
          </Card>
        )}
      </main>

      {/* Form Modal */}
      <PackageFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        package={editingPackage}
        onSave={handleSavePackage}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paquete?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{packageToDelete?.name}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
