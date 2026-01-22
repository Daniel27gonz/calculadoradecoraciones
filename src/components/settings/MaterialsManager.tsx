import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';

interface Material {
  id: string;
  name: string;
  category: string;
  base_unit: string;
  purchase_unit: string;
  presentation_price: number;
  quantity_per_presentation: number;
  cost_per_unit: number;
  is_custom: boolean;
}

interface EditingMaterial {
  id?: string;
  name: string;
  category: string;
  base_unit: string;
  purchase_unit: string;
  presentation_price: number;
  quantity_per_presentation: number;
}

const defaultMaterial: EditingMaterial = {
  name: '',
  category: 'general',
  base_unit: 'unidad',
  purchase_unit: 'paquete',
  presentation_price: 0,
  quantity_per_presentation: 1,
};

export function MaterialsManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<EditingMaterial>(defaultMaterial);
  const [hasChanges, setHasChanges] = useState(false);

  const currency = getCurrencyByCode(profile?.currency || 'USD');

  useEffect(() => {
    if (user) {
      fetchMaterials();
    }
  }, [user]);

  const fetchMaterials = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_materials')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales',
        variant: 'destructive',
      });
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  const calculateCostPerUnit = (price: number, quantity: number): number => {
    if (quantity <= 0) return 0;
    return price / quantity;
  };

  const handleAdd = () => {
    setFormData(defaultMaterial);
    setIsAdding(true);
    setEditingId(null);
  };

  const handleEdit = (material: Material) => {
    setFormData({
      id: material.id,
      name: material.name,
      category: material.category,
      base_unit: material.base_unit || 'unidad',
      purchase_unit: material.purchase_unit || 'paquete',
      presentation_price: material.presentation_price || 0,
      quantity_per_presentation: material.quantity_per_presentation || 1,
    });
    setEditingId(material.id);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setFormData(defaultMaterial);
    setEditingId(null);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del material es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (formData.quantity_per_presentation <= 0) {
      toast({
        title: 'Error',
        description: 'La cantidad por presentación debe ser mayor a 0',
        variant: 'destructive',
      });
      return;
    }

    const materialData = {
      name: formData.name.trim(),
      category: formData.category || 'general',
      base_unit: formData.base_unit || 'unidad',
      purchase_unit: formData.purchase_unit || 'paquete',
      presentation_price: formData.presentation_price || 0,
      quantity_per_presentation: formData.quantity_per_presentation || 1,
      price: calculateCostPerUnit(formData.presentation_price, formData.quantity_per_presentation),
      is_custom: true,
      user_id: user.id,
    };

    if (editingId) {
      // Update existing material
      const { error } = await supabase
        .from('user_materials')
        .update(materialData)
        .eq('id', editingId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating material:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el material',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Actualizado',
        description: 'Material actualizado correctamente',
      });
    } else {
      // Insert new material
      const { error } = await supabase
        .from('user_materials')
        .insert(materialData);

      if (error) {
        console.error('Error adding material:', error);
        toast({
          title: 'Error',
          description: 'No se pudo agregar el material',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Agregado',
        description: 'Material agregado correctamente',
      });
    }

    await fetchMaterials();
    handleCancel();
    setHasChanges(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_materials')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el material',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Eliminado',
      description: 'Material eliminado correctamente',
    });
    await fetchMaterials();
  };

  const handleInputChange = (field: keyof EditingMaterial, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

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
                Gestiona tus materiales con costos detallados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Inicia sesión para gestionar tus materiales
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Package className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Materiales</CardTitle>
              <CardDescription>
                Gestiona tus materiales con costos detallados
              </CardDescription>
            </div>
          </div>
          {!isAdding && !editingId && (
            <Button variant="soft" size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="bg-muted/50 rounded-xl p-4 space-y-4 border border-border">
            <h4 className="font-medium text-sm">
              {isAdding ? 'Nuevo material' : 'Editar material'}
            </h4>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  Nombre del material
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Globos de látex 11 pulgadas"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="base_unit" className="text-xs text-muted-foreground">
                    Unidad base de uso
                  </Label>
                  <Input
                    id="base_unit"
                    value={formData.base_unit}
                    onChange={(e) => handleInputChange('base_unit', e.target.value)}
                    placeholder="Ej: unidad, pieza, metro"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="purchase_unit" className="text-xs text-muted-foreground">
                    Unidad de compra
                  </Label>
                  <Input
                    id="purchase_unit"
                    value={formData.purchase_unit}
                    onChange={(e) => handleInputChange('purchase_unit', e.target.value)}
                    placeholder="Ej: bolsa, paquete, caja"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="presentation_price" className="text-xs text-muted-foreground">
                    Precio de la presentación
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {currency?.symbol || '$'}
                    </span>
                    <Input
                      id="presentation_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.presentation_price || ''}
                      onChange={(e) => handleInputChange('presentation_price', parseFloat(e.target.value) || 0)}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="quantity_per_presentation" className="text-xs text-muted-foreground">
                    Cantidad por presentación
                  </Label>
                  <Input
                    id="quantity_per_presentation"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.quantity_per_presentation || ''}
                    onChange={(e) => handleInputChange('quantity_per_presentation', parseFloat(e.target.value) || 1)}
                    className="mt-1"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Calculated cost per unit */}
              <div className="bg-primary/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Costo por unidad:</span>
                  <span className="text-lg font-bold text-primary">
                    {currency?.symbol || '$'}
                    {calculateCostPerUnit(formData.presentation_price, formData.quantity_per_presentation).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculado automáticamente: precio ÷ cantidad
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="gradient" 
                size="sm" 
                onClick={handleSave}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-1" />
                Guardar cambios
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Materials List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando materiales...
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              No tienes materiales registrados
            </p>
            <p className="text-muted-foreground/70 text-xs mt-1">
              Agrega tus materiales para calcular costos precisos
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{material.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      {material.purchase_unit}: {currency?.symbol}{material.presentation_price?.toFixed(2) || '0.00'}
                    </span>
                    <span>
                      × {material.quantity_per_presentation || 1} {material.base_unit}
                    </span>
                    <span className="font-medium text-primary">
                      = {currency?.symbol}{material.cost_per_unit?.toFixed(2) || '0.00'}/{material.base_unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(material)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
