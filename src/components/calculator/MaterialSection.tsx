import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Material } from '@/types/quote';

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
}

const suggestedMaterials = [
  'Glue dots',
  'Cinta',
  'Nylon',
  'Base',
  'Tubo PVC',
  'Tela',
  'Flores',
];

export function MaterialSection({ materials, onChange }: MaterialSectionProps) {
  const addMaterial = (name?: string) => {
    onChange([
      ...materials,
      { id: crypto.randomUUID(), name: name || '', costPerUnit: 0, quantity: 1 },
    ]);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const total = materials.reduce((sum, m) => sum + m.costPerUnit * m.quantity, 0);

  const unusedSuggestions = suggestedMaterials.filter(
    name => !materials.some(m => m.name.toLowerCase() === name.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎀</span>
            Materiales
          </CardTitle>
          <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick add buttons */}
        {unusedSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.slice(0, 4).map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => addMaterial(name)}
                className="text-xs"
              >
                + {name}
              </Button>
            ))}
          </div>
        )}

        {materials.map((material, index) => (
          <div
            key={material.id}
            className="p-4 rounded-xl bg-lavender-light/50 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <Input
                value={material.name}
                onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                placeholder="Nombre del material"
                className="font-medium border-none bg-transparent p-0 h-auto text-base focus-visible:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMaterial(material.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Costo/unidad</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={material.costPerUnit}
                  onChange={(e) => updateMaterial(material.id, { costPerUnit: Number(e.target.value) })}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input
                  type="number"
                  min="0"
                  value={material.quantity}
                  onChange={(e) => updateMaterial(material.id, { quantity: Number(e.target.value) })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-sm font-semibold text-accent-foreground">
                Subtotal: ${(material.costPerUnit * material.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <Button variant="lavender" className="w-full" onClick={() => addMaterial()}>
          <Plus className="w-4 h-4" />
          Agregar material
        </Button>
      </CardContent>
    </Card>
  );
}
