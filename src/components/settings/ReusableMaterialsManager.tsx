import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Package, Info, TrendingUp, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReusableMaterial {
  id: string;
  name: string;
  material_cost: number;
  cost_per_use: number;
  purchase_date: string | null;
}

interface RecoveryEvent {
  quoteId: string;
  clientName: string;
  eventDate: string | null;
  costApplied: number;
  quantity: number;
}

interface RecoveryData {
  totalRecovered: number;
  events: RecoveryEvent[];
}

interface ReusableMaterialsManagerProps {
  currencySymbol: string;
}

export function ReusableMaterialsManager({ currencySymbol }: ReusableMaterialsManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<ReusableMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ReusableMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    material_cost: 0,
    cost_per_use: 0,
    purchase_date: null as Date | null,
  });
  const [usagePercentage, setUsagePercentage] = useState<number | ''>('');
  const [isManualCostOverride, setIsManualCostOverride] = useState(false);
  const [usefulLife, setUsefulLife] = useState<number | ''>('');

  // Recovery data per material
  const [recoveryData, setRecoveryData] = useState<Record<string, RecoveryData>>({});
  const [expandedRecovery, setExpandedRecovery] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reusable_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setMaterials(data || []);

      // Load recovery data for all materials
      if (data && data.length > 0) {
        loadRecoveryData(data);
      }
    } catch (error) {
      console.error('Error loading reusable materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales reutilizables',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecoveryData = async (mats: ReusableMaterial[]) => {
    if (!user) return;

    try {
      // Get all quotes that have reusable_materials_used
      const { data: quotes, error } = await supabase
        .from('quotes')
        .select('id, client_name, event_date, reusable_materials_used')
        .eq('user_id', user.id)
        .not('reusable_materials_used', 'is', null);

      if (error) throw error;

      const recovery: Record<string, RecoveryData> = {};

      for (const mat of mats) {
        recovery[mat.id] = { totalRecovered: 0, events: [] };
      }

      if (quotes) {
        for (const quote of quotes) {
          const usedMaterials = quote.reusable_materials_used as any[];
          if (!Array.isArray(usedMaterials)) continue;

          for (const used of usedMaterials) {
            const matId = used.reusableMaterialId;
            if (recovery[matId]) {
              const costApplied = (used.costPerUse || 0) * (used.quantity || 1);
              recovery[matId].totalRecovered += costApplied;
              recovery[matId].events.push({
                quoteId: quote.id,
                clientName: quote.client_name,
                eventDate: quote.event_date,
                costApplied,
                quantity: used.quantity || 1,
              });
            }
          }
        }
      }

      setRecoveryData(recovery);
    } catch (error) {
      console.error('Error loading recovery data:', error);
    }
  };

  const openAddDialog = () => {
    setEditingMaterial(null);
    setFormData({ name: '', material_cost: 0, cost_per_use: 0, purchase_date: null });
    setUsagePercentage('');
    setIsManualCostOverride(false);
    setUsefulLife('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (material: ReusableMaterial) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      material_cost: material.material_cost,
      cost_per_use: material.cost_per_use,
      purchase_date: material.purchase_date ? new Date(material.purchase_date + 'T12:00:00') : null,
    });
    // Try to reverse-calculate percentage
    if (material.material_cost > 0) {
      const pct = (material.cost_per_use / material.material_cost) * 100;
      if (pct >= 10 && pct <= 20) {
        setUsagePercentage(Math.round(pct * 100) / 100);
        setIsManualCostOverride(false);
      } else {
        setUsagePercentage('');
        setIsManualCostOverride(true);
      }
    } else {
      setUsagePercentage('');
      setIsManualCostOverride(true);
    }
    setUsefulLife('');
    setIsDialogOpen(true);
  };

  // Auto-calculate cost_per_use when percentage or material_cost changes
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

  const handleSave = async () => {
    if (!user || !formData.name.trim()) return;

    const purchaseDateStr = formData.purchase_date
      ? format(formData.purchase_date, 'yyyy-MM-dd')
      : null;

    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from('reusable_materials')
          .update({
            name: formData.name.trim(),
            material_cost: formData.material_cost,
            cost_per_use: formData.cost_per_use,
            purchase_date: purchaseDateStr,
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;

        // Update transaction if purchase_date and cost exist
        if (purchaseDateStr && formData.material_cost > 0) {
          const refId = `reusable_${editingMaterial.id}`;
          // Delete old transaction first, then re-insert
          await supabase.from('transactions').delete().eq('reference_id', refId).eq('user_id', user.id);
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'expense',
            amount: formData.material_cost,
            description: `Inversión en equipo: ${formData.name.trim()}`,
            category: 'Inversión en equipo',
            transaction_date: purchaseDateStr,
            reference_id: refId,
          });
        } else {
          // Remove transaction if no date
          const refId = `reusable_${editingMaterial.id}`;
          await supabase.from('transactions').delete().eq('reference_id', refId).eq('user_id', user.id);
        }

        toast({ title: 'Guardado', description: 'Material actualizado correctamente' });
      } else {
        const { data: inserted, error } = await supabase
          .from('reusable_materials')
          .insert({
            user_id: user.id,
            name: formData.name.trim(),
            material_cost: formData.material_cost,
            cost_per_use: formData.cost_per_use,
            purchase_date: purchaseDateStr,
          })
          .select('id')
          .single();

        if (error) throw error;

        // Create transaction for investment
        if (inserted && purchaseDateStr && formData.material_cost > 0) {
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'expense',
            amount: formData.material_cost,
            description: `Inversión en equipo: ${formData.name.trim()}`,
            category: 'Inversión en equipo',
            transaction_date: purchaseDateStr,
            reference_id: `reusable_${inserted.id}`,
          });
        }

        toast({ title: 'Guardado', description: 'Material agregado correctamente' });
      }

      setIsDialogOpen(false);
      loadMaterials();
    } catch (error) {
      console.error('Error saving reusable material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el material',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Delete associated transaction
      await supabase.from('transactions').delete().eq('reference_id', `reusable_${id}`).eq('user_id', user!.id);

      const { error } = await supabase
        .from('reusable_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Eliminado', description: 'Material eliminado correctamente' });
      loadMaterials();
    } catch (error) {
      console.error('Error deleting reusable material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el material',
        variant: 'destructive',
      });
    }
  };

  const toggleRecovery = (id: string) => {
    setExpandedRecovery(prev => prev === id ? null : id);
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-xl">🧮</span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Material Reutilizable (Renta de Equipo Decorativo)</CardTitle>
              <CardDescription>
                Bases, estructuras y mobiliario
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openAddDialog} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Cargando...</div>
        ) : materials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tienes materiales reutilizables</p>
            <p className="text-xs mt-1">Agrega bases, estructuras o mobiliario que uses en múltiples eventos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => {
              const rd = recoveryData[material.id];
              const recovered = rd?.totalRecovered || 0;
              const remaining = Math.max(0, material.material_cost - recovered);
              const progressPct = material.material_cost > 0
                ? Math.min(100, (recovered / material.material_cost) * 100)
                : 0;
              const isExpanded = expandedRecovery === material.id;

              return (
                <div key={material.id} className="rounded-lg border border-border overflow-hidden">
                  {/* Material info row */}
                  <div className="flex items-center justify-between p-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{material.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        <span>Costo: {currencySymbol}{material.material_cost.toFixed(2)}</span>
                        <span className="text-primary font-medium">Uso: {currencySymbol}{material.cost_per_use.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleRecovery(material.id)}
                        title="Recuperación"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(material)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Recovery section */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2 border-t border-border pt-2 bg-muted/30">
                      <p className="text-xs font-semibold text-foreground">Recuperación del material</p>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Valor total</p>
                          <p className="text-xs font-bold">{currencySymbol}{material.material_cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Recuperado</p>
                          <p className="text-xs font-bold text-green-600">{currencySymbol}{recovered.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Por recuperar</p>
                          <p className="text-xs font-bold text-orange-600">{currencySymbol}{remaining.toFixed(2)}</p>
                        </div>
                      </div>

                      <Progress value={progressPct} className="h-2" />
                      <p className="text-[10px] text-muted-foreground text-right">{progressPct.toFixed(0)}% recuperado</p>

                      {rd && rd.events.length > 0 ? (
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          <p className="text-[10px] font-medium text-muted-foreground">Eventos donde se usó:</p>
                          {rd.events.map((ev, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-background border border-border">
                              <div className="min-w-0">
                                <span className="font-medium truncate block">{ev.clientName}</span>
                                {ev.eventDate && <span className="text-[10px] text-muted-foreground">{ev.eventDate}</span>}
                              </div>
                              <span className="font-medium text-primary shrink-0 ml-2">
                                {currencySymbol}{ev.costApplied.toFixed(2)}
                                {ev.quantity > 1 && <span className="text-muted-foreground"> (×{ev.quantity})</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Aún no se ha usado en ningún evento
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMaterial ? 'Editar material' : 'Agregar material reutilizable'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Material</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Base metálica grande"
                />
              </div>

              {/* Material cost */}
              <div className="space-y-2">
                <Label htmlFor="material_cost">Precio de compra original del material</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="material_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.material_cost || ''}
                    onChange={(e) => handleMaterialCostChange(Number(e.target.value))}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Precio de compra original del material
                </p>
              </div>

              {/* Purchase date */}
              <div className="space-y-2">
                <Label>Fecha de compra</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
                <p className="text-xs text-muted-foreground">
                  Al registrar la fecha, el importe se enviará a Mi Dinero como inversión
                </p>
              </div>

              {/* Usage percentage */}
              <div className="space-y-2">
                <Label htmlFor="usage_percentage">Porcentaje de uso por evento (%)</Label>
                <div className="relative">
                  <Input
                    id="usage_percentage"
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
                <p className="text-xs text-muted-foreground">
                  Selecciona entre 10% y 20% para calcular el costo por uso automáticamente
                </p>
              </div>

              {/* Cost per use (auto-calculated but editable) */}
              <div className="space-y-2">
                <Label htmlFor="cost_per_use">
                  Costo por uso por evento (renta) ✅
                  {!isManualCostOverride && usagePercentage !== '' && (
                    <span className="text-xs text-muted-foreground ml-1">(calculado automáticamente)</span>
                  )}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    id="cost_per_use"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_use || ''}
                    onChange={(e) => handleCostPerUseManualChange(Number(e.target.value))}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Este es el costo que se aplicará a tus cotizaciones. Puedes editarlo manualmente.
                </p>
              </div>

              {/* Useful life (optional) */}
              <div className="space-y-2">
                <Label htmlFor="useful_life">Vida útil estimada (número de eventos) <span className="text-xs text-muted-foreground font-normal">— opcional</span></Label>
                <Input
                  id="useful_life"
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingMaterial ? 'Guardar cambios' : 'Agregar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
