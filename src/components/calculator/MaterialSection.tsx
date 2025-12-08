import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Material } from '@/types/quote';

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const addMaterial = () => {
    onChange([
      ...materials,
      { id: crypto.randomUUID(), name: '', costPerUnit: undefined as unknown as number, quantity: undefined as unknown as number },
    ]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const total = materials.reduce((sum, m) => sum + (m.costPerUnit || 0) * (m.quantity || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎀</span>
              Materiales
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">(Materiales no reutilizables)</p>
          </div>
          <span className="text-lg font-semibold text-primary">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.map((material) => (
          <div
            key={material.id}
            className="p-4 rounded-xl bg-lavender-light/50 space-y-3 animate-fade-in"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Descripción material</label>
                <Input
                  value={material.name}
                  onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                  placeholder="Ej: Cinta de globos 5 metros"
                  className="h-10"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMaterial(material.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 mt-5"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Precio/unidad</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={material.costPerUnit ?? ''}
                  onChange={(e) => updateMaterial(material.id, { costPerUnit: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })}
                  placeholder=""
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input
                  type="number"
                  min="0"
                  value={material.quantity ?? ''}
                  onChange={(e) => updateMaterial(material.id, { quantity: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })}
                  placeholder=""
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-sm font-semibold text-accent-foreground">
                Subtotal: {currencySymbol}{((material.costPerUnit || 0) * (material.quantity || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <Button variant="lavender" className="w-full" onClick={addMaterial}>
          <Plus className="w-4 h-4" />
          Agregar material
        </Button>
      </CardContent>
    </Card>
  );
}
