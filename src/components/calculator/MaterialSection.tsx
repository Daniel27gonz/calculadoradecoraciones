import { useEffect, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const addFromSaved = (saved: SavedMaterial) => {
    // Check if already added
    const existing = materials.find(m => m.name === saved.name);
    if (existing) {
      // Increment quantity
      onChange(materials.map(m => 
        m.id === existing.id 
          ? { ...m, quantity: (m.quantity || 0) + 1 } 
          : m
      ));
    } else {
      const price = saved.latest_presentation_price != null 
        ? Math.round(saved.latest_presentation_price * 100) / 100
        : Math.round((saved.cost_per_unit || 0) * 100) / 100;
      onChange([
        ...materials,
        { id: crypto.randomUUID(), name: saved.name, costPerUnit: price, quantity: 1 },
      ]);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const filteredSaved = savedMaterials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

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
              <span>Materiales de consumo</span>
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
            Busca y selecciona materiales para agregarlos
          </div>
        )}

        {materials.map((material) => (
          <div
            key={material.id}
            className="p-4 rounded-xl bg-lavender-light/50 border border-lavender/30 space-y-4 animate-fade-in"
          >
            {/* Header with name and delete */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-base truncate block">{material.name}</span>
                <span className="text-xs text-muted-foreground">
                  Precio/unidad: {currencySymbol}{(material.costPerUnit || 0).toFixed(2)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMaterial(material.id)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Quantity and subtotal */}
            <div className="grid grid-cols-2 gap-4">
              <NumericField
                label="Cantidad"
                min={0}
                value={material.quantity ?? ''}
                onChange={(e) => updateMaterial(material.id, { 
                  quantity: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0"
              />
              <div className="flex flex-col justify-end">
                <span className="text-xs text-muted-foreground mb-1">Subtotal</span>
                <span className="text-lg font-bold text-accent-foreground tabular-nums">
                  {currencySymbol}{formatCurrency((material.costPerUnit || 0) * (material.quantity || 0))}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Search bar to add materials */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Buscar material para agregar..."
              className="h-12 text-base pl-9 bg-background"
            />
          </div>
          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-md">
              {filteredSaved.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                  No se encontraron materiales
                </div>
              ) : (
                filteredSaved.map((saved) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => addFromSaved(saved)}
                    className="w-full text-left px-3 py-2 hover:bg-accent/50 border-b border-border/50 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-sm truncate">{saved.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {saved.latest_presentation_price != null 
                        ? <>{currencySymbol}{saved.latest_presentation_price.toFixed(2)} <span className="text-primary">(última compra x pieza)</span></>
                        : <>{currencySymbol}{(saved.cost_per_unit || 0).toFixed(2)} × {saved.quantity_per_presentation || 1} unidades</>
                      }
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
