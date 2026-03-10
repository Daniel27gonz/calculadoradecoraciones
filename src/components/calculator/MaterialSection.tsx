import { useEffect, useState, useRef } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Material } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';

interface SavedMaterial {
  id: string;
  name: string;
  cost_per_unit: number | null;
  quantity_per_presentation: number | null;
  latest_presentation_price?: number | null;
}

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const [savedMaterials, setSavedMaterials] = useState<SavedMaterial[]>([]);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [focusedSearch, setFocusedSearch] = useState<string | null>(null);
  const searchRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchSavedMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_materials')
        .select('id, name, cost_per_unit, quantity_per_presentation')
        .eq('user_id', user.id)
        .order('name');

      if (!error && data) {
        // Fetch latest purchase price for each material
        const { data: purchases } = await supabase
          .from('material_purchases')
          .select('material_id, total_paid, quantity_presentations, units_added, purchase_date')
          .eq('user_id', user.id)
          .order('purchase_date', { ascending: false });

        const latestPriceMap = new Map<string, number>();
        if (purchases) {
          for (const p of purchases) {
            if (!latestPriceMap.has(p.material_id)) {
              const pricePerUnit = p.units_added > 0 
                ? p.total_paid / p.units_added 
                : p.total_paid;
              latestPriceMap.set(p.material_id, pricePerUnit);
            }
          }
        }

        setSavedMaterials(data.map(m => ({
          ...m,
          latest_presentation_price: latestPriceMap.get(m.id) ?? null,
        })));
      }
    };

    fetchSavedMaterials();
  }, []);

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

  const selectSavedMaterial = (materialId: string, saved: SavedMaterial) => {
    const price = saved.latest_presentation_price != null 
      ? Math.round(saved.latest_presentation_price * 100) / 100
      : Math.round((saved.cost_per_unit || 0) * 100) / 100;
    updateMaterial(materialId, {
      name: saved.name,
      costPerUnit: price,
    });
    setOpenDropdowns(prev => ({ ...prev, [materialId]: false }));
  };

  const toggleDropdown = (materialId: string) => {
    setOpenDropdowns(prev => ({ ...prev, [materialId]: !prev[materialId] }));
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
              <span>Materiales de Consumo (No Reutilizables)</span>
            </CardTitle>
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
                
                {/* Saved materials dropdown */}
                {savedMaterials.length > 0 && (
                  <Collapsible 
                    open={openDropdowns[material.id]} 
                    onOpenChange={() => toggleDropdown(material.id)}
                    className="mt-2"
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-between text-xs h-9 bg-background hover:bg-lavender/20"
                      >
                        <span>Seleccionar de mis materiales</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openDropdowns[material.id] ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-md">
                        {savedMaterials.map((saved) => (
                          <button
                            key={saved.id}
                            type="button"
                            onClick={() => selectSavedMaterial(material.id, saved)}
                            className="w-full text-left px-3 py-2 hover:bg-lavender/20 border-b border-border/50 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm truncate">{saved.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {saved.latest_presentation_price != null 
                                ? <>{currencySymbol}{saved.latest_presentation_price.toFixed(2)} <span className="text-green-600">(última compra x pieza)</span></>
                                : <>{currencySymbol}{(saved.cost_per_unit || 0).toFixed(2)} × {saved.quantity_per_presentation || 1} unidades</>
                              }
                            </div>
                          </button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
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

        <Button variant="lavender" className="w-full h-12 text-base font-medium" onClick={addMaterial}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar material
        </Button>
      </CardContent>
    </Card>
  );
}
