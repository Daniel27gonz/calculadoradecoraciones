import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Search, Sparkles, Package, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Material } from '@/types/quote';
import { useMaterialPrices, MaterialPrice } from '@/hooks/useMaterialPrices';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const { allMaterialsWithPrices, findMaterialPrice, loading } = useMaterialPrices();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
    setSearchTerm('');
    setIsSearchFocused(false);
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

  // Filter suggestions based on search term
  const filteredSuggestions = searchTerm.trim()
    ? allMaterialsWithPrices.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allMaterialsWithPrices;

  // Group materials by category for the catalog view
  const groupedByCategory = allMaterialsWithPrices.reduce((acc, material) => {
    if (!acc[material.categoryName]) {
      acc[material.categoryName] = [];
    }
    acc[material.categoryName].push(material);
    return acc;
  }, {} as Record<string, MaterialPrice[]>);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {/* Main search with autocomplete */}
        {allMaterialsWithPrices.length > 0 && (
          <div className="space-y-3">
            <div 
              ref={searchRef}
              className="relative"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <Input
                  placeholder="🔍 Buscar y agregar material..."
                  className="pl-10 h-12 text-base border-primary/30 focus:border-primary bg-primary/5 placeholder:text-muted-foreground/70"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Dropdown with suggestions */}
              {isSearchFocused && (
                <div className="absolute z-50 w-full mt-1 bg-card border-2 border-primary/20 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                  {filteredSuggestions.length > 0 ? (
                    <>
                      <div className="sticky top-0 px-3 py-2 bg-muted/80 backdrop-blur-sm border-b text-xs font-medium text-muted-foreground">
                        {searchTerm ? `${filteredSuggestions.length} resultados` : 'Todos los materiales con precio'}
                      </div>
                      {filteredSuggestions.slice(0, 15).map((suggestion) => (
                        <button
                          key={`${suggestion.category}-${suggestion.name}`}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-primary/10 active:bg-primary/20 flex items-center justify-between gap-3 border-b border-border/30 last:border-0 transition-colors"
                          onClick={() => addMaterialFromSuggestion(suggestion)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{suggestion.name}</p>
                              <p className="text-xs text-muted-foreground">{suggestion.categoryName}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-base font-bold text-primary">
                              {currencySymbol}{formatCurrency(suggestion.price)}
                            </span>
                            <p className="text-xs text-muted-foreground">Tap para agregar</p>
                          </div>
                        </button>
                      ))}
                      {filteredSuggestions.length > 15 && (
                        <div className="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/50">
                          +{filteredSuggestions.length - 15} más...
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        No se encontró "{searchTerm}"
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          addMaterial();
                          setSearchTerm('');
                          setIsSearchFocused(false);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar manualmente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible catalog by category */}
            <Collapsible open={isCatalogOpen} onOpenChange={setIsCatalogOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-10 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Ver catálogo completo por categoría
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isCatalogOpen && "rotate-180"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2">
                {Object.entries(groupedByCategory).map(([categoryName, categoryMaterials]) => (
                  <div key={categoryName} className="rounded-lg border bg-muted/30 overflow-hidden">
                    <div className="px-3 py-2 bg-muted/50 border-b">
                      <span className="text-sm font-medium">{categoryName}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({categoryMaterials.length} items)
                      </span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {categoryMaterials.map((material) => (
                        <button
                          key={`catalog-${material.category}-${material.name}`}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-primary/5 active:bg-primary/10 flex items-center justify-between gap-2 transition-colors"
                          onClick={() => addMaterialFromSuggestion(material)}
                        >
                          <span className="text-sm truncate">{material.name}</span>
                          <span className="text-sm font-semibold text-primary shrink-0">
                            {currencySymbol}{formatCurrency(material.price)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Added materials list */}
        {materials.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay materiales agregados</p>
            <p className="text-xs mt-1">Usa el buscador arriba para agregar materiales rápidamente</p>
          </div>
        )}

        {materials.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>Materiales en esta cotización ({materials.length})</span>
            </div>
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
          </div>
        )}

        <Button variant="lavender" className="w-full h-12 text-base font-medium" onClick={addMaterial}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar material manualmente
        </Button>
      </CardContent>
    </Card>
  );
}
