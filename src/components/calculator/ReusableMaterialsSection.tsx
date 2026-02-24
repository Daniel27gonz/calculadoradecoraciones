import { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumericField } from '@/components/ui/numeric-field';
import { ReusableMaterialUsed } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SavedReusableMaterial {
  id: string;
  name: string;
  cost_per_use: number;
}

interface ReusableMaterialsSectionProps {
  reusableMaterialsUsed: ReusableMaterialUsed[];
  onChange: (materials: ReusableMaterialUsed[]) => void;
  currencySymbol?: string;
}

export function ReusableMaterialsSection({ 
  reusableMaterialsUsed, 
  onChange, 
  currencySymbol = '$' 
}: ReusableMaterialsSectionProps) {
  const [savedMaterials, setSavedMaterials] = useState<SavedReusableMaterial[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchSavedMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('reusable_materials')
        .select('id, name, cost_per_use')
        .eq('user_id', user.id)
        .order('name');

      if (!error && data) {
        setSavedMaterials(data);
      }
    };

    fetchSavedMaterials();
  }, []);

  const addMaterial = (saved: SavedReusableMaterial) => {
    // Check if already added
    const existing = reusableMaterialsUsed.find(m => m.reusableMaterialId === saved.id);
    if (existing) {
      // Just increment quantity
      onChange(reusableMaterialsUsed.map(m => 
        m.reusableMaterialId === saved.id 
          ? { ...m, quantity: m.quantity + 1 } 
          : m
      ));
    } else {
      // Add new
      onChange([
        ...reusableMaterialsUsed,
        {
          id: crypto.randomUUID(),
          reusableMaterialId: saved.id,
          name: saved.name,
          costPerUse: saved.cost_per_use,
          quantity: 1,
        },
      ]);
    }
    setIsDropdownOpen(false);
  };

  const updateMaterial = (id: string, updates: Partial<ReusableMaterialUsed>) => {
    onChange(reusableMaterialsUsed.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const removeMaterial = (id: string) => {
    onChange(reusableMaterialsUsed.filter(m => m.id !== id));
  };

  const total = reusableMaterialsUsed.reduce(
    (sum, m) => sum + (m.costPerUse || 0) * (m.quantity || 0), 
    0
  );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Filter out already added materials
  const availableMaterials = savedMaterials.filter(
    saved => !reusableMaterialsUsed.some(used => used.reusableMaterialId === saved.id)
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">🧮</span>
              <span>Material Reutilizable (Renta de Equipo Decorativo)</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 ml-8 sm:ml-9">
              Bases, estructuras, herramientas
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-accent/30 border border-accent/40">
            <span className="text-sm sm:text-base font-bold text-accent-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reusableMaterialsUsed.length === 0 && savedMaterials.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes materiales reutilizables configurados</p>
            <p className="text-xs mt-1">Agrégalos desde Ajustes → Materiales reutilizables</p>
          </div>
        )}

        {reusableMaterialsUsed.length === 0 && savedMaterials.length > 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay materiales reutilizables agregados a esta cotización
          </div>
        )}

        {reusableMaterialsUsed.map((material) => (
          <div
            key={material.id}
            className="p-4 rounded-xl bg-accent/10 border border-accent/30 space-y-4 animate-fade-in"
          >
            {/* Header with name and delete */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-base truncate block">{material.name}</span>
                <span className="text-xs text-muted-foreground">
                  Costo por uso: {currencySymbol}{material.costPerUse.toFixed(2)}
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

            {/* Quantity field */}
            <div className="grid grid-cols-2 gap-4">
              <NumericField
                label="Cantidad"
                min={1}
                value={material.quantity ?? 1}
                onChange={(e) => updateMaterial(material.id, { 
                  quantity: e.target.value === '' ? 1 : Number(e.target.value) 
                })}
                placeholder="1"
              />
              <div className="flex flex-col justify-end">
                <span className="text-xs text-muted-foreground mb-1">Costo por uso:</span>
                <span className="text-lg font-bold text-accent-foreground tabular-nums">
                  {currencySymbol}{formatCurrency((material.costPerUse || 0) * (material.quantity || 0))}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Add materials dropdown */}
        {savedMaterials.length > 0 && (
          <Collapsible 
            open={isDropdownOpen} 
            onOpenChange={setIsDropdownOpen}
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full h-12 text-base font-medium justify-between"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Agregar material reutilizable
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-background shadow-md">
                {availableMaterials.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Todos los materiales ya fueron agregados
                  </div>
                ) : (
                  availableMaterials.map((saved) => (
                    <button
                      key={saved.id}
                      type="button"
                      onClick={() => addMaterial(saved)}
                      className="w-full text-left px-4 py-3 hover:bg-accent/20 border-b border-border/50 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-sm">{saved.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Costo por uso: {currencySymbol}{saved.cost_per_use.toFixed(2)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
