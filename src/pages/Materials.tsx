import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterials, CategoryWithMaterials } from '@/hooks/useMaterials';
import { getCurrencyByCode } from '@/lib/currencies';
import { defaultMaterialCategories } from '@/lib/defaultMaterials';

export default function Materials() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { loading, saving, getCategoriesWithMaterials, addCustomMaterial, deleteMaterial, saveAllChanges } = useMaterials();
  
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');
  const categories = getCategoriesWithMaterials();

  // Track local price changes
  const handlePriceChange = (categoryId: string, materialName: string, price: number) => {
    const key = `${categoryId}:${materialName}`;
    setLocalPrices((prev) => ({
      ...prev,
      [key]: price,
    }));
    setHasChanges(true);
  };

  // Get displayed price (local or from DB)
  const getDisplayPrice = (categoryId: string, materialName: string, dbPrice: number): number => {
    const key = `${categoryId}:${materialName}`;
    return localPrices[key] !== undefined ? localPrices[key] : dbPrice;
  };

  // Save all changes
  const handleSaveAll = async () => {
    const updatedMaterials: { categoryId: string; name: string; price: number; isCustom: boolean }[] = [];

    categories.forEach((category) => {
      category.materials.forEach((material) => {
        const key = `${category.id}:${material.name}`;
        const price = localPrices[key] !== undefined ? localPrices[key] : material.price;
        if (price > 0 || localPrices[key] !== undefined) {
          updatedMaterials.push({
            categoryId: category.id,
            name: material.name,
            price,
            isCustom: material.isCustom,
          });
        }
      });
    });

    const success = await saveAllChanges(updatedMaterials);
    if (success) {
      setLocalPrices({});
      setHasChanges(false);
    }
  };

  // Add new material
  const handleAddMaterial = async () => {
    if (!newMaterialName.trim() || !selectedCategory) return;

    const success = await addCustomMaterial(selectedCategory, newMaterialName.trim());
    if (success) {
      setNewMaterialName('');
      setSelectedCategory('');
      setAddDialogOpen(false);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (materialId: string) => {
    await deleteMaterial(materialId);
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 md:pb-8 md:pt-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Volver</span>
            </Button>
            <h1 className="font-display text-lg sm:text-xl font-semibold text-center flex-1">
              Lista de Materiales
            </h1>
            <div className="flex items-center gap-2">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!user}>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">Agregar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Agregar material</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo material a tu lista
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-50">
                          {defaultMaterialCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del material</Label>
                      <Input
                        id="name"
                        value={newMaterialName}
                        onChange={(e) => setNewMaterialName(e.target.value)}
                        placeholder="Ej: Globos especiales"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleAddMaterial} 
                      disabled={!newMaterialName.trim() || !selectedCategory || saving}
                    >
                      {saving ? 'Agregando...' : 'Agregar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Login prompt */}
        {!user && (
          <Card className="border-primary/30 bg-rose-light/20">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="font-display text-lg font-semibold mb-2">
                Inicia sesión para guardar precios
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crea una cuenta para guardar tus precios y personalizaciones.
              </p>
              <Button variant="gradient" onClick={() => navigate('/auth')}>
                Iniciar sesión
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Materials List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center text-xl">
                🎈
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Decoración con Globos</CardTitle>
                <CardDescription>
                  Administra tus materiales y precios
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {categories.map((category) => (
                <AccordionItem 
                  key={category.id} 
                  value={category.id}
                  className="border rounded-lg px-4 bg-card"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {category.materials.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3">
                      {category.materials.map((material) => (
                        <div 
                          key={material.name} 
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {material.name}
                            </p>
                            {material.isCustom && (
                              <span className="text-xs text-primary">Personalizado</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {currentCurrency?.symbol || '$'}
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={getDisplayPrice(category.id, material.name, material.price) || ''}
                              onChange={(e) => handlePriceChange(
                                category.id, 
                                material.name, 
                                parseFloat(e.target.value) || 0
                              )}
                              placeholder="0.00"
                              className="w-24 h-9 text-right"
                              disabled={!user}
                            />
                            {material.isCustom && material.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteMaterial(material.id!)}
                                disabled={saving}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Save button - fixed at bottom on mobile */}
        {user && (
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent md:relative md:bottom-auto md:p-0 md:bg-transparent">
            <Button
              variant="gradient"
              size="lg"
              className="w-full"
              onClick={handleSaveAll}
              disabled={saving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
            </Button>
          </div>
        )}

        {/* Info card */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm font-medium">Consejo</p>
                <p className="text-xs text-muted-foreground">
                  Actualiza los precios de tus materiales regularmente para mantener 
                  tus cotizaciones precisas. Los precios se guardarán automáticamente 
                  cuando presiones "Guardar cambios".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
