import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Label } from '@/components/ui/label';
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
      { 
        id: crypto.randomUUID(), 
        name: '', 
        baseUnit: 'unidad',
        purchaseUnit: 'paquete',
        presentationPrice: undefined as unknown as number,
        quantityPerPresentation: undefined as unknown as number,
        costPerUnit: 0,
        quantity: undefined as unknown as number 
      },
    ]);
  };

  const calculateCostPerUnit = (presentationPrice: number, quantityPerPresentation: number): number => {
    if (!quantityPerPresentation || quantityPerPresentation <= 0) return 0;
    return presentationPrice / quantityPerPresentation;
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => {
      if (m.id !== id) return m;
      
      const updated = { ...m, ...updates };
      // Auto-calculate cost per unit when presentation price or quantity changes
      if ('presentationPrice' in updates || 'quantityPerPresentation' in updates) {
        updated.costPerUnit = calculateCostPerUnit(
          updated.presentationPrice || 0, 
          updated.quantityPerPresentation || 1
        );
      }
      return updated;
    }));
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const total = materials.reduce((sum, m) => sum + (m.costPerUnit || 0) * (m.quantity || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">🎀</span>
              <span>Materiales</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 ml-8 sm:ml-9">(Materiales no reutilizables)</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-lavender/30 border border-lavender/40">
            <span className="text-sm sm:text-base font-bold text-accent-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {materials.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay materiales agregados
          </div>
        )}

        {materials.map((material) => (
          <div
            key={material.id}
            className="p-4 rounded-xl bg-lavender-light/50 border border-lavender/30 space-y-4 animate-fade-in"
          >
            {/* Header with delete button */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Nombre del material
                </label>
                <Input
                  value={material.name}
                  onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                  placeholder="Ej: Globos de látex 11 pulgadas"
                  className="h-11 text-base"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMaterial(material.id)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Units row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Unidad base de uso
                </Label>
                <Input
                  value={material.baseUnit || ''}
                  onChange={(e) => updateMaterial(material.id, { baseUnit: e.target.value })}
                  placeholder="Ej: unidad, pieza, metro"
                  className="h-10 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Unidad de compra
                </Label>
                <Input
                  value={material.purchaseUnit || ''}
                  onChange={(e) => updateMaterial(material.id, { purchaseUnit: e.target.value })}
                  placeholder="Ej: bolsa, paquete"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Presentation price and quantity */}
            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label="Precio de presentación"
                prefix={currencySymbol}
                min={0}
                step={0.01}
                value={material.presentationPrice ?? ''}
                onChange={(e) => updateMaterial(material.id, { 
                  presentationPrice: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0.00"
              />
              <NumericField
                label="Cantidad por presentación"
                min={1}
                step={1}
                value={material.quantityPerPresentation ?? ''}
                onChange={(e) => updateMaterial(material.id, { 
                  quantityPerPresentation: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="1"
              />
            </div>

            {/* Calculated cost per unit */}
            <div className="bg-primary/10 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Costo por unidad:</span>
                <span className="text-base font-bold text-primary">
                  {currencySymbol}{formatCurrency(material.costPerUnit || 0)} / {material.baseUnit || 'unidad'}
                </span>
              </div>
            </div>

            {/* Quantity to use */}
            <div className="pt-2 border-t border-lavender/20">
              <NumericField
                label={`Cantidad a usar (${material.baseUnit || 'unidades'})`}
                min={0}
                value={material.quantity ?? ''}
                onChange={(e) => updateMaterial(material.id, { 
                  quantity: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0"
              />
            </div>

            {/* Subtotal */}
            <div className="flex justify-end pt-2 border-t border-lavender/20">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block mb-0.5">Subtotal</span>
                <span className="text-base sm:text-lg font-bold text-accent-foreground tabular-nums">
                  {currencySymbol}{formatCurrency((material.costPerUnit || 0) * (material.quantity || 0))}
                </span>
              </div>
            </div>
          </div>
        ))}

        <Button variant="lavender" className="w-full h-12 text-base font-medium" onClick={addMaterial}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar material
        </Button>
      </CardContent>
    </Card>
  );
}
