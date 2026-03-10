import { useEffect, useState } from 'react';
import { Plus, Trash2, Package, Save, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { ReusableMaterialUsed } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCostPerUse, setNewCostPerUse] = useState('');
  const [newMaterialCost, setNewMaterialCost] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => {
    fetchSavedMaterials();
  }, []);

  const handleCreateMaterial = async () => {
    if (!newName.trim() || !newCostPerUse) return;
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSaving(false); return; }

    const { data, error } = await supabase
      .from('reusable_materials')
      .insert({
        user_id: user.id,
        name: newName.trim(),
        cost_per_use: Number(newCostPerUse),
        material_cost: Number(newMaterialCost) || 0,
      })
      .select('id, name, cost_per_use')
      .single();

    if (error) {
      toast.error('Error al crear material');
    } else if (data) {
      toast.success('Material creado y agregado');
      setSavedMaterials(prev => [...prev, data]);
      addMaterial(data);
      setNewName('');
      setNewCostPerUse('');
      setNewMaterialCost('');
      setShowCreateForm(false);
    }
    setIsSaving(false);
  };

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
    setSearchQuery('');
    setIsSearchFocused(false);
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

  // Filter out already added materials and apply search
  const availableMaterials = savedMaterials.filter(
    saved => !reusableMaterialsUsed.some(used => used.reusableMaterialId === saved.id)
  );

  const filteredMaterials = availableMaterials.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
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
              Bases, estructuras y mobiliario
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
        {reusableMaterialsUsed.length === 0 && savedMaterials.length === 0 && !showCreateForm && (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes materiales reutilizables configurados</p>
            <Button
              variant="link"
              className="text-xs mt-1"
              onClick={() => setShowCreateForm(true)}
            >
              + Crear uno nuevo aquí
            </Button>
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

        {/* Create new material form */}
        {showCreateForm && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Crear nuevo material reutilizable</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder="Nombre del material"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumericField
                label="Costo por uso"
                value={newCostPerUse}
                onChange={(e) => setNewCostPerUse(e.target.value)}
                placeholder="0.00"
                min={0}
              />
              <NumericField
                label="Costo del material"
                value={newMaterialCost}
                onChange={(e) => setNewMaterialCost(e.target.value)}
                placeholder="0.00 (opcional)"
                min={0}
              />
            </div>
            <Button
              onClick={handleCreateMaterial}
              disabled={!newName.trim() || !newCostPerUse || isSaving}
              className="w-full"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Guardando...' : 'Guardar y agregar'}
            </Button>
          </div>
        )}

        {/* Add materials dropdown */}
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
              {availableMaterials.map((saved) => (
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
              ))}
              {/* Create new option at bottom of list */}
              <button
                type="button"
                onClick={() => { setShowCreateForm(true); setIsDropdownOpen(false); }}
                className="w-full text-left px-4 py-3 hover:bg-primary/10 border-t border-border transition-colors text-primary font-medium text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear nuevo material
              </button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
