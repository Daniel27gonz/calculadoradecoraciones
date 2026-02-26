import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReusableMaterial {
  id: string;
  name: string;
  material_cost: number;
  cost_per_use: number;
}

interface ReusableMaterialsManagerProps {
  currencySymbol: string;
}

export function ReusableMaterialsManager({ currencySymbol }: ReusableMaterialsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<ReusableMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ReusableMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    material_cost: 0,
    cost_per_use: 0,
  });

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reusable_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading reusable materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales reutilizables',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingMaterial(null);
    setFormData({ name: '', material_cost: 0, cost_per_use: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (material: ReusableMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      material_cost: material.material_cost,
      cost_per_use: material.cost_per_use,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('reusable_materials')
          .update({
            name: formData.name.trim(),
            material_cost: formData.material_cost,
            cost_per_use: formData.cost_per_use,
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;
        toast({ title: 'Guardado', description: 'Material actualizado correctamente' });
      } else {
        const { error } = await supabase
          .from('reusable_materials')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            material_cost: formData.material_cost,
            cost_per_use: formData.cost_per_use,
          });

        if (error) throw error;
        toast({ title: 'Guardado', description: 'Material agregado correctamente' });
      }

      setIsDialogOpen(false);
      loadMaterials();
    } catch (error) {
      console.error('Error saving reusable material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el material',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reusable_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Eliminado', description: 'Material eliminado correctamente' });
      loadMaterials();
    } catch (error) {
      console.error('Error deleting reusable material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el material',
        variant: 'destructive',
      });
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-xl">🧮</span>
            </div>
            <div>
              <CardTitle className="text-lg">Material Reutilizable (Renta de Equipo Decorativo)</CardTitle>
              <CardDescription>
                Bases, estructuras, herramientas, mobiliario
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes materiales reutilizables</p>
            <p className="text-xs mt-1">Agrega bases, estructuras o herramientas que uses en múltiples eventos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{material.name}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>Costo: {currencySymbol}{material.material_cost.toFixed(2)}</span>
                    <span className="text-primary font-medium">Uso: {currencySymbol}{material.cost_per_use.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditDialog(material)}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar material' : 'Agregar material reutilizable'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Material</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Base metálica grande"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material_cost">Costo del material (informativo)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="material_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.material_cost || ''}
                    onChange={(e) => setFormData({ ...formData, material_cost: Number(e.target.value) })}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Precio de compra original del material
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost_per_use">Costo por uso por evento (renta) ✅</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="cost_per_use"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_use || ''}
                    onChange={(e) => setFormData({ ...formData, cost_per_use: Number(e.target.value) })}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este es el costo que se aplicará a tus cotizaciones
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingMaterial ? 'Guardar cambios' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
