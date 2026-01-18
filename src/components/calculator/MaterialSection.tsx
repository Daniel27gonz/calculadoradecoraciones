import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Material } from '@/types/quote';
import { useMaterialPrices, MaterialPrice } from '@/hooks/useMaterialPrices';
import { cn } from '@/lib/utils';

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const { allMaterialsWithPrices, findMaterialPrice, getSuggestions, loading } = useMaterialPrices();
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<string | null>(null);
  const [suggestionFilter, setSuggestionFilter] = useState<Record<string, string>>({});
  const suggestionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const addMaterial = () => {
    onChange([
      ...materials,
      { id: crypto.randomUUID(), name: '', costPerUnit: undefined as unknown as number, quantity: undefined as unknown as number },
    ]);
  };

  const addMaterialFromSuggestion = (suggestion: MaterialPrice) => {
    const newMaterial: Material = {
      id: crypto.randomUUID(),
      name: suggestion.name,
      costPerUnit: suggestion.price,
      quantity: 1,
    };
    onChange([...materials, newMaterial]);
    setActiveSuggestionIndex(null);
  };

  const updateMaterial = (id: string, updates: Partial<Material>) => {
    onChange(materials.map(m => {
      if (m.id !== id) return m;
      
      const updated = { ...m, ...updates };
      
      // If name changed, try to auto-fill price
      if (updates.name !== undefined && updates.name !== m.name) {
        const priceInfo = findMaterialPrice(updates.name);
        if (priceInfo && (!m.costPerUnit || m.costPerUnit === 0)) {
          updated.costPerUnit = priceInfo.price;
        }
      }
      
      return updated;
    }));
  };

  const applyPriceFromLibrary = (id: string, materialName: string) => {
    const priceInfo = findMaterialPrice(materialName);
    if (priceInfo) {
      updateMaterial(id, { costPerUnit: priceInfo.price });
    }
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  const total = materials.reduce((sum, m) => sum + (m.costPerUnit || 0) * (m.quantity || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeSuggestionIndex) {
        const ref = suggestionRefs.current[activeSuggestionIndex];
        if (ref && !ref.contains(e.target as Node)) {
          setActiveSuggestionIndex(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeSuggestionIndex]);

  const filteredSuggestions = (materialId: string) => {
    const filter = suggestionFilter[materialId] || '';
    return getSuggestions(filter, 8);
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
        {/* Quick add from library */}
        {allMaterialsWithPrices.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Agregar desde tu biblioteca</span>
            </div>
            <div className="relative" ref={(el) => { suggestionRefs.current['quick-add'] = el; }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar material con precio guardado..."
                  className="pl-9"
                  value={suggestionFilter['quick-add'] || ''}
                  onChange={(e) => {
                    setSuggestionFilter(prev => ({ ...prev, 'quick-add': e.target.value }));
                    setActiveSuggestionIndex('quick-add');
                  }}
                  onFocus={() => setActiveSuggestionIndex('quick-add')}
                />
              </div>
              {activeSuggestionIndex === 'quick-add' && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuggestions('quick-add').length > 0 ? (
                    filteredSuggestions('quick-add').map((suggestion) => (
                      <button
                        key={`${suggestion.category}-${suggestion.name}`}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted/50 flex items-center justify-between gap-2 border-b border-border/50 last:border-0"
                        onClick={() => {
                          addMaterialFromSuggestion(suggestion);
                          setSuggestionFilter(prev => ({ ...prev, 'quick-add': '' }));
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{suggestion.name}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.categoryName}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary shrink-0">
                          {currencySymbol}{formatCurrency(suggestion.price)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No se encontraron materiales
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {materials.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay materiales agregados
          </div>
        )}

        {materials.map((material) => {
          const priceInfo = findMaterialPrice(material.name);
          const hasSavedPrice = priceInfo && priceInfo.price > 0;
          const priceMatchesSaved = hasSavedPrice && material.costPerUnit === priceInfo.price;

          return (
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
                  <div className="relative">
                    <Input
                      value={material.name}
                      onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                      placeholder="Ej: Cinta de globos 5 metros"
                      className="h-11 text-base"
                    />
                    {hasSavedPrice && !priceMatchesSaved && material.costPerUnit !== priceInfo.price && (
                      <button
                        type="button"
                        onClick={() => applyPriceFromLibrary(material.id, material.name)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors"
                      >
                        Usar {currencySymbol}{formatCurrency(priceInfo.price)}
                      </button>
                    )}
                  </div>
                  {hasSavedPrice && priceMatchesSaved && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Precio de tu biblioteca
                    </p>
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
          );
        })}

        <Button variant="lavender" className="w-full h-12 text-base font-medium" onClick={addMaterial}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar material manualmente
        </Button>
      </CardContent>
    </Card>
  );
}
