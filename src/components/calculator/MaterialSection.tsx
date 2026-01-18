import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Material } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UserMaterial {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface MaterialSectionProps {
  materials: Material[];
  onChange: (materials: Material[]) => void;
  currencySymbol?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  balloons: '🎈 Globos',
  tapes: '🎀 Cintas',
  bases: '🧱 Bases',
  structures: '🏗️ Estructuras',
  accessories: '✨ Accesorios',
  tools: '🔧 Herramientas',
  other: '📦 Otros',
};

export function MaterialSection({ materials, onChange, currencySymbol = '$' }: MaterialSectionProps) {
  const { user } = useAuth();
  const [savedMaterials, setSavedMaterials] = useState<UserMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Fetch saved materials from settings
  useEffect(() => {
    const fetchMaterials = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_materials')
          .select('*')
          .eq('user_id', user.id)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;
        
        setSavedMaterials(data?.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price || 0,
          category: m.category,
        })) || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [user]);

  // Filter saved materials by search
  const filteredSavedMaterials = useMemo(() => {
    if (!searchQuery.trim()) return savedMaterials;
    const query = searchQuery.toLowerCase();
    return savedMaterials.filter(m => 
      m.name.toLowerCase().includes(query) ||
      CATEGORY_LABELS[m.category]?.toLowerCase().includes(query)
    );
  }, [savedMaterials, searchQuery]);

  // Group materials by category for display
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, UserMaterial[]> = {};
    filteredSavedMaterials.forEach(m => {
      if (!groups[m.category]) {
        groups[m.category] = [];
      }
      groups[m.category].push(m);
    });
    return groups;
  }, [filteredSavedMaterials]);

  const addMaterial = () => {
    onChange([
      ...materials,
      { id: crypto.randomUUID(), name: '', costPerUnit: undefined as unknown as number, quantity: undefined as unknown as number },
    ]);
  };

  const addFromSaved = (savedMaterial: UserMaterial) => {
    onChange([
      ...materials,
      { 
        id: crypto.randomUUID(), 
        name: savedMaterial.name, 
        costPerUnit: savedMaterial.price, 
        quantity: 1 
      },
    ]);
    setOpenPopoverId(null);
    setSearchQuery('');
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

        {/* Add material buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {savedMaterials.length > 0 && (
            <Popover open={openPopoverId === 'add-saved'} onOpenChange={(open) => setOpenPopoverId(open ? 'add-saved' : null)}>
              <PopoverTrigger asChild>
                <Button variant="lavender" className="flex-1 h-12 text-base font-medium">
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Agregar de mis materiales
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar material..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Cargando materiales...
                    </div>
                  ) : Object.keys(groupedMaterials).length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery ? 'No se encontraron materiales' : 'No hay materiales guardados'}
                    </div>
                  ) : (
                    Object.entries(groupedMaterials).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50 sticky top-0">
                          {CATEGORY_LABELS[category] || category}
                        </div>
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => addFromSaved(item)}
                            className="w-full px-3 py-2 text-left hover:bg-accent/50 flex items-center justify-between gap-2 transition-colors"
                          >
                            <span className="text-sm truncate">{item.name}</span>
                            <span className="text-xs font-medium text-muted-foreground shrink-0">
                              {currencySymbol}{item.price.toFixed(2)}
                            </span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <Button variant="outline" className="flex-1 h-12 text-base font-medium" onClick={addMaterial}>
            <Plus className="w-5 h-5 mr-2" />
            Agregar manual
          </Button>
        </div>

        {savedMaterials.length === 0 && !isLoading && (
          <p className="text-xs text-center text-muted-foreground">
            💡 Puedes agregar materiales predefinidos en Ajustes → Lista de Materiales
          </p>
        )}
      </CardContent>
    </Card>
  );
}
