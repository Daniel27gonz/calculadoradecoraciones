import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Package, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';

interface Material {
  id: string;
  name: string;
  base_unit: string;
  purchase_unit: string;
  presentation_price: number;
  quantity_per_presentation: number;
  cost_per_unit: number;
  category: string;
  isEditing?: boolean;
  isNew?: boolean;
}

export function MaterialsManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');

  useEffect(() => {
    if (user) {
      fetchMaterials();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;

      setMaterials(
        (data || []).map((m) => ({
          id: m.id,
          name: m.name,
          // Show exactly what the user saved; don't force defaults in the UI.
          base_unit: m.base_unit || '',
          purchase_unit: m.purchase_unit || '',
          presentation_price: m.presentation_price ?? 0,
          // Use 0 so the numeric input renders blank when the DB value is null.
          quantity_per_presentation: m.quantity_per_presentation ?? 0,
          cost_per_unit: m.cost_per_unit ?? 0,
          category: m.category,
        }))
      );
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addMaterial = () => {
    const newMaterial: Material = {
      id: `new-${Date.now()}`,
      name: '',
      // Start blank so each user can fill it manually.
      base_unit: '',
      purchase_unit: '',
      presentation_price: 0,
      quantity_per_presentation: 0,
      cost_per_unit: 0,
      category: 'general',
      isNew: true,
      isEditing: true,
    };
    setMaterials([newMaterial, ...materials]);
    setHasChanges(true);
  };

  const updateMaterial = (id: string, field: keyof Material, value: string | number) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        
        const updated = { ...m, [field]: value };
        
        // Auto-calculate cost per unit when presentation price or quantity changes
        if (field === 'presentation_price' || field === 'quantity_per_presentation') {
          const price = field === 'presentation_price' ? Number(value) : updated.presentation_price;
          const qty = field === 'quantity_per_presentation' ? Number(value) : updated.quantity_per_presentation;
          if (qty > 0) {
            updated.cost_per_unit = Number((price / qty).toFixed(4));
          }
        }
        
        return updated;
      })
    );
    setHasChanges(true);
  };

  const toggleEdit = (id: string) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isEditing: !m.isEditing } : m))
    );
  };

  const removeMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!user) return;

    // Validate all materials have names
    const invalidMaterials = materials.filter((m) => !m.name.trim());
    if (invalidMaterials.length > 0) {
      toast({
        title: 'Error',
        description: 'Todos los materiales deben tener un nombre',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Get current materials from DB to determine what to delete
      const { data: existingMaterials } = await supabase
        .from('user_materials')
        .select('id')
        .eq('user_id', user.id);

      const existingIds = new Set((existingMaterials || []).map((m) => m.id));
      const currentIds = new Set(materials.filter((m) => !m.isNew).map((m) => m.id));

      // Delete removed materials
      const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_materials')
          .delete()
          .in('id', toDelete);
        if (deleteError) throw deleteError;
      }

      // Upsert all current materials
      for (const material of materials) {
        const materialData = {
          user_id: user.id,
          name: material.name.trim(),
          base_unit: material.base_unit,
          purchase_unit: material.purchase_unit,
          presentation_price: material.presentation_price,
          quantity_per_presentation: material.quantity_per_presentation,
          cost_per_unit: material.cost_per_unit,
          category: material.category || 'general',
        };

        if (material.isNew) {
          const { error } = await supabase.from('user_materials').insert(materialData);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_materials')
            .update(materialData)
            .eq('id', material.id);
          if (error) throw error;
        }
      }

      toast({
        title: 'Guardado',
        description: 'Los materiales se han guardado correctamente',
      });

      setHasChanges(false);
      // Refresh to get proper IDs
      await fetchMaterials();
    } catch (error) {
      console.error('Error saving materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los materiales',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
              <CardDescription>Gestiona tu catálogo de materiales</CardDescription>
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Package className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Materiales</CardTitle>
              <CardDescription>Cargando...</CardDescription>
            </div>
          </div>
        </CardHeader>
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
              <CardDescription>Gestiona tu catálogo de materiales</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addMaterial}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No tienes materiales guardados</p>
            <p className="text-sm">Agrega materiales para usarlos en tus cotizaciones</p>
          </div>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => (
              <div
                key={material.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {material.isEditing ? (
                      <Input
                        value={material.name}
                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                        placeholder="Nombre del material"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">
                        {material.name || 'Sin nombre'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleEdit(material.id)}
                      className="h-8 w-8"
                    >
                      {material.isEditing ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Edit2 className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMaterial(material.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {material.isEditing && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Unidad base de uso
                      </Label>
                      <Input
                        value={material.base_unit}
                        onChange={(e) =>
                          updateMaterial(material.id, 'base_unit', e.target.value)
                        }
                        placeholder="ej: unidad, metro"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Unidad de compra
                      </Label>
                      <Input
                        value={material.purchase_unit}
                        onChange={(e) =>
                          updateMaterial(material.id, 'purchase_unit', e.target.value)
                        }
                        placeholder="ej: paquete, rollo"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Precio presentación ({currentCurrency?.symbol || '$'})
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={material.presentation_price || ''}
                        onChange={(e) =>
                          updateMaterial(
                            material.id,
                            'presentation_price',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder=""
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Cantidad por presentación
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={material.quantity_per_presentation || ''}
                        onChange={(e) =>
                          updateMaterial(
                            material.id,
                            'quantity_per_presentation',
                            e.target.value === '' ? 1 : Number(e.target.value)
                          )
                        }
                        placeholder=""
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <Label className="text-xs text-muted-foreground">
                        Costo por unidad ({currentCurrency?.symbol || '$'})
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.0001"
                        value={material.cost_per_unit || ''}
                        onChange={(e) =>
                          updateMaterial(
                            material.id,
                            'cost_per_unit',
                            e.target.value === '' ? 0 : Number(e.target.value)
                          )
                        }
                        placeholder="Auto-calculado"
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                )}

                {!material.isEditing && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="block text-xs">Unidad base</span>
                      <span className="text-foreground">{material.base_unit}</span>
                    </div>
                    <div>
                      <span className="block text-xs">Unidad compra</span>
                      <span className="text-foreground">{material.purchase_unit}</span>
                    </div>
                    <div>
                      <span className="block text-xs">Precio pres.</span>
                      <span className="text-foreground">
                        {currentCurrency?.symbol || '$'}
                        {material.presentation_price.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs">Costo/unidad</span>
                      <span className="text-foreground">
                        {currentCurrency?.symbol || '$'}
                        {material.cost_per_unit.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {hasChanges && (
          <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-card via-card to-transparent">
            <Button
              onClick={saveChanges}
              disabled={saving}
              className="w-full"
              variant="gradient"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
