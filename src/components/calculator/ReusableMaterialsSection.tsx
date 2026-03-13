import { useEffect, useState } from 'react';
import { Plus, Trash2, Package, X, Search, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [isSaving, setIsSaving] = useState(false);

  // Full form state matching inventory
  const [formData, setFormData] = useState({
    name: '',
    material_cost: 0,
    cost_per_use: 0,
    purchase_date: null as Date | null,
  });
  const [usagePercentage, setUsagePercentage] = useState<number | ''>('');
  const [isManualCostOverride, setIsManualCostOverride] = useState(false);
  const [usefulLife, setUsefulLife] = useState<number | ''>('');

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

  const resetForm = () => {
    setFormData({ name: '', material_cost: 0, cost_per_use: 0, purchase_date: null });
    setUsagePercentage('');
    setIsManualCostOverride(false);
    setUsefulLife('');
  };

  const handlePercentageChange = (value: string) => {
    const num = value === '' ? '' : Number(value);
    setUsagePercentage(num);
    setIsManualCostOverride(false);

    if (num !== '' && formData.material_cost > 0) {
      const calculated = formData.material_cost * (num / 100);
      setFormData(prev => ({ ...prev, cost_per_use: Math.round(calculated * 100) / 100 }));
    }
  };

  const handleMaterialCostChange = (value: number) => {
    setFormData(prev => {
      const updated = { ...prev, material_cost: value };
      if (!isManualCostOverride && usagePercentage !== '' && value > 0) {
        updated.cost_per_use = Math.round(value * (Number(usagePercentage) / 100) * 100) / 100;
      }
      return updated;
    });
  };

  const handleCostPerUseManualChange = (value: number) => {
    setIsManualCostOverride(true);
    setFormData(prev => ({ ...prev, cost_per_use: value }));
  };

  const suggestedCostByLife = usefulLife !== '' && formData.material_cost > 0
    ? Math.round((formData.material_cost / Number(usefulLife)) * 100) / 100
    : null;

  const handleCreateMaterial = async () => {
    if (!formData.name.trim()) return;
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSaving(false); return; }

    const purchaseDateStr = formData.purchase_date
      ? format(formData.purchase_date, 'yyyy-MM-dd')
      : null;

    const { data, error } = await supabase
      .from('reusable_materials')
      .insert({
        user_id: user.id,
        name: formData.name.trim(),
        material_cost: formData.material_cost,
        cost_per_use: formData.cost_per_use,
        purchase_date: purchaseDateStr,
      })
      .select('id, name, cost_per_use')
      .single();

    if (error) {
      toast.error('Error al crear material');
    } else if (data) {
      // Register transaction as investment if date and cost exist
      if (purchaseDateStr && formData.material_cost > 0) {
        await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'expense',
          amount: formData.material_cost,
          description: `Inversión en equipo: ${formData.name.trim()}`,
          category: 'Inversión en equipo',
          transaction_date: purchaseDateStr,
          reference_id: `reusable_${data.id}`,
        });
      }

      toast.success('Material creado y agregado');
      setSavedMaterials(prev => [...prev, data]);
      addMaterial(data);
      resetForm();
      setShowCreateForm(false);
    }
    setIsSaving(false);
  };

  const addMaterial = (saved: SavedReusableMaterial) => {
    const existing = reusableMaterialsUsed.find(m => m.reusableMaterialId === saved.id);
    if (existing) {
      onChange(reusableMaterialsUsed.map(m => 
        m.reusableMaterialId === saved.id 
          ? { ...m, quantity: m.quantity + 1 } 
          : m
      ));
    } else {
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
              <span>Renta/ alquiler de elementos decorativos</span>
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

        {/* Full create form matching inventory */}
        {showCreateForm && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Crear nuevo material reutilizable</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setShowCreateForm(false); resetForm(); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Material</Label>
              <Input
                placeholder="Ej: Base metálica grande"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* Material cost */}
            <div className="space-y-1.5">
              <Label className="text-xs">Precio de compra original del material</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.material_cost || ''}
                  onChange={(e) => handleMaterialCostChange(Number(e.target.value))}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Purchase date */}
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de compra</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !formData.purchase_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.purchase_date
                      ? format(formData.purchase_date, "PPP", { locale: es })
                      : "Selecciona una fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.purchase_date || undefined}
                    onSelect={(date) => setFormData(prev => ({ ...prev, purchase_date: date || null }))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <p className="text-[10px] text-muted-foreground">
                Al registrar la fecha, el importe se enviará a Mi Dinero como inversión
              </p>
            </div>

            {/* Usage percentage */}
            <div className="space-y-1.5">
              <Label className="text-xs">Porcentaje de uso por evento (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  min="10"
                  max="20"
                  step="0.01"
                  value={usagePercentage === '' ? '' : usagePercentage}
                  onChange={(e) => handlePercentageChange(e.target.value)}
                  placeholder="10 - 20"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Selecciona entre 10% y 20% para calcular el costo por uso automáticamente
              </p>
            </div>

            {/* Cost per use */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Costo por uso por evento (renta) ✅
                {!isManualCostOverride && usagePercentage !== '' && (
                  <span className="text-[10px] text-muted-foreground ml-1">(calculado automáticamente)</span>
                )}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{currencySymbol}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cost_per_use || ''}
                  onChange={(e) => handleCostPerUseManualChange(Number(e.target.value))}
                  className="pl-8"
                  placeholder="0.00"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Este es el costo que se aplicará a tus cotizaciones. Puedes editarlo manualmente.
              </p>
            </div>

            {/* Useful life */}
            <div className="space-y-1.5">
              <Label className="text-xs">Vida útil estimada (número de eventos) <span className="text-[10px] text-muted-foreground font-normal">— opcional</span></Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={usefulLife === '' ? '' : usefulLife}
                onChange={(e) => setUsefulLife(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej: 20"
              />
              {suggestedCostByLife !== null && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-accent/20 border border-accent/30">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium">Costo sugerido por uso: {currencySymbol}{suggestedCostByLife.toFixed(2)}</p>
                    <p className="text-muted-foreground mt-0.5">
                      {currencySymbol}{formData.material_cost.toFixed(2)} ÷ {usefulLife} eventos = {currencySymbol}{suggestedCostByLife.toFixed(2)} por evento
                    </p>
                    <p className="text-muted-foreground mt-0.5 italic">Este cálculo es solo de referencia</p>
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateMaterial}
              disabled={!formData.name.trim() || isSaving}
              className="w-full"
              size="sm"
            >
              {isSaving ? 'Guardando...' : 'Guardar y agregar'}
            </Button>
          </div>
        )}

        {/* Search bar for adding materials */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder="Escribe el nombre del material para agregarlo"
              className="h-12 text-base pl-9 bg-background"
            />
          </div>
          {searchQuery.trim() === '' && !isSearchFocused && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-1">
              Escribe el nombre del material para encontrarlo.
            </p>
          )}
          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-md">
              {filteredMaterials.length === 0 ? (
                <div className="px-3 py-3 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">No encontramos ese material.</p>
                  <p className="text-xs text-muted-foreground">Puedes agregarlo en la sección Materiales.</p>
                </div>
              ) : (
                filteredMaterials.map((saved) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => addMaterial(saved)}
                    className="w-full text-left px-4 py-3 hover:bg-accent/50 border-b border-border/50 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-sm">{saved.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Costo por uso: {currencySymbol}{saved.cost_per_use.toFixed(2)}
                    </div>
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={() => { setShowCreateForm(true); setSearchQuery(''); setIsSearchFocused(false); }}
                className="w-full text-left px-4 py-3 hover:bg-primary/10 border-t border-border transition-colors text-primary font-medium text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear nuevo material
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
