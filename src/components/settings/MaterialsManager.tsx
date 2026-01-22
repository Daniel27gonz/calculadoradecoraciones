import { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Material {
  id: string;
  name: string;
  base_unit: string;
  purchase_unit: string;
  presentation_price: number | null;
  quantity_per_presentation: number | null;
  cost_per_unit: number | null;
  isNew?: boolean;
}

export function MaterialsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch materials from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('user_materials')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMaterials(data?.map(m => ({
          id: m.id,
          name: m.name,
          base_unit: m.base_unit || '',
          purchase_unit: m.purchase_unit || '',
          presentation_price: m.presentation_price,
          quantity_per_presentation: m.quantity_per_presentation,
          cost_per_unit: m.cost_per_unit,
        })) || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los materiales",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [user, toast]);

  const addMaterial = () => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      name: '',
      base_unit: '',
      purchase_unit: '',
      presentation_price: null,
      quantity_per_presentation: null,
      cost_per_unit: null,
      isNew: true,
    };
    setMaterials([...materials, newMaterial]);
  };

  const updateMaterial = (id: string, field: keyof Material, value: string | number | null) => {
    setMaterials(materials.map(m => {
      if (m.id !== id) return m;
      
      const updated = { ...m, [field]: value };
      
      // Auto-calculate cost per unit
      if (field === 'presentation_price' || field === 'quantity_per_presentation') {
        const price = field === 'presentation_price' ? (value as number) : updated.presentation_price;
        const qty = field === 'quantity_per_presentation' ? (value as number) : updated.quantity_per_presentation;
        
        if (price && qty && qty > 0) {
          updated.cost_per_unit = Math.round((price / qty) * 10000) / 10000;
        } else {
          updated.cost_per_unit = null;
        }
      }
      
      return updated;
    }));
  };

  const removeMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const saveMaterials = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Delete all existing materials for user
      const { error: deleteError } = await supabase
        .from('user_materials')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Insert all current materials
      if (materials.length > 0) {
        const materialsToInsert = materials.map(m => ({
          id: m.id,
          user_id: user.id,
          name: m.name || 'Sin nombre',
          category: 'general',
          base_unit: m.base_unit || null,
          purchase_unit: m.purchase_unit || null,
          presentation_price: m.presentation_price,
          quantity_per_presentation: m.quantity_per_presentation,
          cost_per_unit: m.cost_per_unit,
        }));

        const { error: insertError } = await supabase
          .from('user_materials')
          .insert(materialsToInsert);

        if (insertError) throw insertError;
      }

      // Remove isNew flag from all materials
      setMaterials(materials.map(m => ({ ...m, isNew: false })));

      toast({
        title: "Guardado",
        description: "Tus materiales han sido guardados correctamente",
      });
    } catch (error) {
      console.error('Error saving materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los materiales",
        variant: "destructive",
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
              <CardDescription>
                Gestiona tu catálogo de materiales
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
                Registra tus materiales para usar en cotizaciones
              </CardDescription>
            </div>
          </div>
          {materials.length > 0 && (
            <Button 
              variant="soft" 
              size="sm" 
              onClick={saveMaterials}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {materials.map((material, index) => (
              <div 
                key={material.id} 
                className="p-4 rounded-lg border border-border bg-muted/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Material {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMaterial(material.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Material Name */}
                <div className="space-y-2">
                  <Label>Nombre del material</Label>
                  <Input
                    value={material.name}
                    onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                    placeholder=""
                  />
                </div>

                {/* Units Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Unidad base de uso</Label>
                    <Input
                      value={material.base_unit}
                      onChange={(e) => updateMaterial(material.id, 'base_unit', e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unidad de compra</Label>
                    <Input
                      value={material.purchase_unit}
                      onChange={(e) => updateMaterial(material.id, 'purchase_unit', e.target.value)}
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Pricing Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Precio de la presentación</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.presentation_price ?? ''}
                      onChange={(e) => updateMaterial(
                        material.id, 
                        'presentation_price', 
                        e.target.value === '' ? null : Number(e.target.value)
                      )}
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de la presentación</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={material.quantity_per_presentation ?? ''}
                      onChange={(e) => updateMaterial(
                        material.id, 
                        'quantity_per_presentation', 
                        e.target.value === '' ? null : Number(e.target.value)
                      )}
                      placeholder=""
                    />
                  </div>
                </div>

                {/* Cost per unit (calculated) */}
                <div className="space-y-2">
                  <Label>Costo por unidad</Label>
                  <div className="h-10 px-3 py-2 rounded-md border border-border bg-muted/50 flex items-center">
                    <span className="text-sm">
                      {material.cost_per_unit !== null 
                        ? `$${material.cost_per_unit.toFixed(4)}` 
                        : '—'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se calcula automáticamente (precio ÷ cantidad)
                  </p>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addMaterial}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar material
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
