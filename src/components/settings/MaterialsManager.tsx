import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';

const PURCHASE_UNITS = [
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'metro', label: 'Metro' },
  { value: 'litro', label: 'Litro' },
  { value: 'kilo', label: 'Kilo' },
];

interface Material {
  id: string;
  name: string;
  purchase_unit: string;
  presentation_price: number | null;
  quantity_per_presentation: number | null;
  cost_per_unit: number | null;
}

export function MaterialsManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id' | 'cost_per_unit'>>({
    name: '',
    purchase_unit: '',
    presentation_price: null,
    quantity_per_presentation: null,
  });

  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMaterials(data?.map(m => ({
        id: m.id,
        name: m.name,
        purchase_unit: m.purchase_unit || '',
        presentation_price: m.presentation_price,
        quantity_per_presentation: m.quantity_per_presentation,
        cost_per_unit: m.cost_per_unit,
      })) || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCostPerUnit = (price: number | null, quantity: number | null): number | null => {
    if (price === null || quantity === null || quantity === 0) return null;
    return price / quantity;
  };

  const handleAddMaterial = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para guardar materiales",
        variant: "destructive",
      });
      return;
    }

    if (!newMaterial.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del material es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from('user_materials').insert({
        user_id: user.id,
        name: newMaterial.name.trim(),
        purchase_unit: newMaterial.purchase_unit.trim() || null,
        presentation_price: newMaterial.presentation_price,
        quantity_per_presentation: newMaterial.quantity_per_presentation,
        category: 'general',
      });

      if (error) throw error;

      toast({
        title: "Material guardado",
        description: "El material se ha agregado correctamente",
      });

      setNewMaterial({
        name: '',
        purchase_unit: '',
        presentation_price: null,
        quantity_per_presentation: null,
      });

      loadMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el material",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Material eliminado",
        description: "El material se ha eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el material",
        variant: "destructive",
      });
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial({ ...material });
    setEditDialogOpen(true);
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !user) return;

    if (!editingMaterial.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del material es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_materials')
        .update({
          name: editingMaterial.name.trim(),
          purchase_unit: editingMaterial.purchase_unit.trim() || null,
          presentation_price: editingMaterial.presentation_price,
          quantity_per_presentation: editingMaterial.quantity_per_presentation,
        })
        .eq('id', editingMaterial.id);

      if (error) throw error;

      toast({
        title: "Material actualizado",
        description: "El material se ha actualizado correctamente",
      });

      setEditDialogOpen(false);
      setEditingMaterial(null);
      loadMaterials();
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el material",
        variant: "destructive",
      });
    }
  };

  const editCostPerUnit = editingMaterial 
    ? calculateCostPerUnit(editingMaterial.presentation_price, editingMaterial.quantity_per_presentation)
    : null;

  const formatCurrency = (value: number | null): string => {
    if (value === null) return '-';
    return `${currentCurrency?.symbol || '$'}${value.toFixed(2)}`;
  };

  const displayCostPerUnit = calculateCostPerUnit(
    newMaterial.presentation_price,
    newMaterial.quantity_per_presentation
  );

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Package className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Materiales</CardTitle>
              <CardDescription>
                Gestiona tu catálogo de materiales
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              Inicia sesión para gestionar tus materiales
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Package className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Materiales</CardTitle>
            <CardDescription>
              Registra tus materiales para calcular costos automáticamente
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form to add new material */}
        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>Nombre del material</Label>
            <Input
              value={newMaterial.name}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unidad de compra</Label>
              <Select
                value={newMaterial.purchase_unit}
                onValueChange={(value) => setNewMaterial(prev => ({ ...prev, purchase_unit: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {PURCHASE_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Precio de la presentación</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newMaterial.presentation_price ?? ''}
                onChange={(e) => setNewMaterial(prev => ({ 
                  ...prev, 
                  presentation_price: e.target.value === '' ? null : Number(e.target.value)
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cantidad de la presentación</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={newMaterial.quantity_per_presentation ?? ''}
                onChange={(e) => setNewMaterial(prev => ({ 
                  ...prev, 
                  quantity_per_presentation: e.target.value === '' ? null : Number(e.target.value)
                }))}
              />
            </div>
          </div>

          {/* Calculated cost per unit */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">
              Costo por {['bolsa', 'paquete', 'caja'].includes(newMaterial.purchase_unit) ? 'pieza' : 'unidad'}:
            </span>
            <span className="text-lg font-bold text-primary">
              {displayCostPerUnit !== null ? formatCurrency(displayCostPerUnit) : '-'}
            </span>
          </div>

          <Button onClick={handleAddMaterial} className="w-full" variant="gradient">
            <Plus className="w-4 h-4 mr-2" />
            Agregar material
          </Button>
        </div>

        {/* List of saved materials */}
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Cargando materiales...
          </div>
        ) : materials.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Materiales guardados ({materials.length})
            </h4>
            <div className="space-y-2">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{material.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {material.purchase_unit && `Compra: ${material.purchase_unit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(material.cost_per_unit)}/{['bolsa', 'paquete', 'caja'].includes(material.purchase_unit) ? 'pieza' : 'unidad'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(material.presentation_price)} × {material.quantity_per_presentation ?? '-'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditMaterial(material)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteMaterial(material.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes materiales guardados</p>
          </div>
        )}

        {/* Edit Material Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Editar Material</DialogTitle>
            </DialogHeader>
            {editingMaterial && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del material</Label>
                  <Input
                    value={editingMaterial.name}
                    onChange={(e) => setEditingMaterial(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidad de compra</Label>
                  <Select
                    value={editingMaterial.purchase_unit}
                    onValueChange={(value) => setEditingMaterial(prev => prev ? { ...prev, purchase_unit: value } : null)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {PURCHASE_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio de la presentación</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingMaterial.presentation_price ?? ''}
                      onChange={(e) => setEditingMaterial(prev => prev ? { 
                        ...prev, 
                        presentation_price: e.target.value === '' ? null : Number(e.target.value)
                      } : null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={editingMaterial.quantity_per_presentation ?? ''}
                      onChange={(e) => setEditingMaterial(prev => prev ? { 
                        ...prev, 
                        quantity_per_presentation: e.target.value === '' ? null : Number(e.target.value)
                      } : null)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">
                    Costo por {['bolsa', 'paquete', 'caja'].includes(editingMaterial.purchase_unit) ? 'pieza' : 'unidad'}:
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {editCostPerUnit !== null ? formatCurrency(editCostPerUnit) : '-'}
                  </span>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="gradient" onClick={handleUpdateMaterial}>
                <Check className="w-4 h-4 mr-2" />
                Guardar cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
