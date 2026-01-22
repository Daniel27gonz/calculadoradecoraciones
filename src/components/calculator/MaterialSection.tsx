import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Material } from '@/types/quote';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SavedMaterial {
  id: string;
  name: string;
  base_unit: string;
  purchase_unit: string;
  presentation_price: number;
  quantity_per_presentation: number;
  cost_per_unit: number;
  category: string;
}

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const { user } = useAuth();
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedMaterials();
    }
  }, [user]);

  const fetchSavedMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;

      setSavedMaterials(
        (data || []).map((m) => ({
          id: m.id,
          name: m.name,
          base_unit: m.base_unit || 'unidad',
          purchase_unit: m.purchase_unit || 'paquete',
          presentation_price: m.presentation_price || 0,
          quantity_per_presentation: m.quantity_per_presentation || 1,
          cost_per_unit: m.cost_per_unit || 0,
          category: m.category,
        }))
      );
    } catch (error) {
      console.error('Error fetching saved materials:', error);
    }
  };

  const addMaterial = () => {
    onChange([
      ...materials,
      { id: crypto.randomUUID(), name: '', costPerUnit: undefined as unknown as number, quantity: undefined as unknown as number },
    ]);
  };

  const addSavedMaterial = (savedMaterial: SavedMaterial) => {
    onChange([
      ...materials,
      {
        id: crypto.randomUUID(),
        name: savedMaterial.name,
        costPerUnit: savedMaterial.cost_per_unit,
        quantity: undefined as unknown as number,
      },
    ]);
    setIsAccordionOpen(false);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => (m.id === id ? { ...m, ...updates } : m)));
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
                  Descripción del material
                </label>
                <Input
                  value={material.name}
                  onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                  placeholder="Ej: Cinta de globos 5 metros"
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

            {/* Numeric fields grid */}
            <div className="grid grid-cols-2 gap-4">
              <NumericField
                label="Precio/unidad"
                prefix={currencySymbol}
                min={0}
                step={0.01}
                value={material.costPerUnit ?? ''}
                onChange={(e) => updateMaterial(material.id, { 
                  costPerUnit: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0.00"
              />
              <NumericField
                label="Cantidad"
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

        {/* Accordion with saved materials */}
        {savedMaterials.length > 0 && (
          <Collapsible open={isAccordionOpen} onOpenChange={setIsAccordionOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium justify-between bg-card border-lavender/40 hover:bg-lavender/10"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  Seleccionar de mis materiales
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-xl border border-lavender/40 bg-card overflow-hidden shadow-sm">
                <div className="max-h-64 overflow-y-auto">
                  {savedMaterials.map((savedMaterial) => (
                    <button
                      key={savedMaterial.id}
                      onClick={() => addSavedMaterial(savedMaterial)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-lavender/20 transition-colors border-b border-lavender/20 last:border-b-0 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground block truncate">
                          {savedMaterial.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {savedMaterial.base_unit} • {currencySymbol}{savedMaterial.cost_per_unit.toFixed(2)}/unidad
                        </span>
                      </div>
                      <Plus className="w-5 h-5 text-primary shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Button variant="lavender" className="w-full h-12 text-base font-medium" onClick={addMaterial}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar material manual
        </Button>
      </CardContent>
    </Card>
  );
}
