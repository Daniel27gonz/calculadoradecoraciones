import { useState, useEffect } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';

interface Material {
  id: string;
  name: string;
  base_unit: string;
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
  const [newMaterial, setNewMaterial] = useState<Omit<Material, 'id' | 'cost_per_unit'>>({
    name: '',
    base_unit: '',
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
        base_unit: m.base_unit || '',
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
        base_unit: newMaterial.base_unit.trim() || null,
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
        base_unit: '',
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del material</Label>
              <Input
                value={newMaterial.name}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidad base de uso</Label>
              <Input
                value={newMaterial.base_unit}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, base_unit: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Unidad de compra</Label>
              <Input
                value={newMaterial.purchase_unit}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, purchase_unit: e.target.value }))}
              />
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
            <span className="text-sm font-medium">Costo por unidad:</span>
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
                      {material.base_unit && `Unidad: ${material.base_unit}`}
                      {material.base_unit && material.purchase_unit && ' • '}
                      {material.purchase_unit && `Compra: ${material.purchase_unit}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(material.cost_per_unit)}/unidad
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(material.presentation_price)} × {material.quantity_per_presentation ?? '-'}
                      </p>
                    </div>
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
      </CardContent>
    </Card>
  );
}
