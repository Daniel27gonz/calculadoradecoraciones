import { useState, useEffect, useMemo } from 'react';
import { Package, Trash2, Pencil, ShoppingCart, AlertTriangle, Search, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';

const PURCHASE_UNITS = [
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'metro', label: 'Metro' },
  { value: 'litro', label: 'Litro' },
  { value: 'kilo', label: 'Kilo' },
];

const CATEGORIES = [
  { value: 'globos', label: 'Globos' },
  { value: 'adhesivos', label: 'Adhesivos' },
  { value: 'cintas', label: 'Cintas' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'otros', label: 'Otros' },
];

interface InventoryMaterial {
  id: string;
  name: string;
  category: string;
  purchase_unit: string;
  presentation_price: number | null;
  quantity_per_presentation: number | null;
  cost_per_unit: number | null;
  stock_current: number;
  stock_minimum: number;
}

const InventoryConsumables = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<InventoryMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit material
  const [editingMaterial, setEditingMaterial] = useState<InventoryMaterial | null>(null);

  // Unified purchase dialog (creates material if new)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchaseMode, setPurchaseMode] = useState<'existing' | 'new'>('existing');
  const [purchase, setPurchase] = useState({
    material_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    provider: '',
    quantity_presentations: 1,
    total_paid: 0,
    notes: '',
  });
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: '',
    purchase_unit: '',
    presentation_price: null as number | null,
    quantity_per_presentation: null as number | null,
    stock_minimum: 0,
  });

  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');
  const sym = currentCurrency?.symbol || '$';

  useEffect(() => {
    if (user) loadMaterials();
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      if (error) throw error;
      setMaterials(
        (data || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category || '',
          purchase_unit: m.purchase_unit || '',
          presentation_price: m.presentation_price,
          quantity_per_presentation: m.quantity_per_presentation,
          cost_per_unit: m.cost_per_unit,
          stock_current: m.stock_current ?? 0,
          stock_minimum: m.stock_minimum ?? 0,
        }))
      );
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) return materials;
    const term = searchTerm.toLowerCase();
    return materials.filter(
      m => m.name.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
    );
  }, [materials, searchTerm]);

  const costPerUnit = (price: number | null, qty: number | null) => {
    if (!price || !qty || qty === 0) return null;
    return price / qty;
  };

  const formatCurrency = (v: number | null) => (v === null ? '-' : `${sym}${v.toFixed(2)}`);

  // ── Edit Material ──
  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !user) return;
    try {
      const { error } = await supabase
        .from('user_materials')
        .update({
          name: editingMaterial.name.trim(),
          category: editingMaterial.category || 'otros',
          purchase_unit: editingMaterial.purchase_unit || null,
          presentation_price: editingMaterial.presentation_price,
          quantity_per_presentation: editingMaterial.quantity_per_presentation,
          stock_minimum: editingMaterial.stock_minimum,
        })
        .eq('id', editingMaterial.id);
      if (error) throw error;
      toast({ title: 'Material actualizado' });
      setEditingMaterial(null);
      loadMaterials();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from('user_materials').delete().eq('id', id);
      if (error) throw error;
      setMaterials(prev => prev.filter(m => m.id !== id));
      toast({ title: 'Material eliminado' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
    }
  };

  // ── Register Purchase (creates material if new) ──
  const handleRegisterPurchase = async () => {
    if (!user) return;

    let materialId = purchase.material_id;
    let materialQtyPerPres = 1;
    let materialName = '';
    let materialStockCurrent = 0;

    if (purchaseMode === 'new') {
      if (!newMaterial.name.trim()) {
        toast({ title: 'Error', description: 'El nombre del material es requerido', variant: 'destructive' });
        return;
      }
      // Create material first
      const { data: created, error: createErr } = await supabase.from('user_materials').insert({
        user_id: user.id,
        name: newMaterial.name.trim(),
        category: newMaterial.category || 'otros',
        purchase_unit: newMaterial.purchase_unit || null,
        presentation_price: newMaterial.presentation_price,
        quantity_per_presentation: newMaterial.quantity_per_presentation,
        stock_minimum: newMaterial.stock_minimum,
      }).select('id, quantity_per_presentation, name, stock_current').single();
      if (createErr || !created) {
        toast({ title: 'Error', description: 'No se pudo crear el material', variant: 'destructive' });
        return;
      }
      materialId = created.id;
      materialQtyPerPres = created.quantity_per_presentation || 1;
      materialName = created.name;
      materialStockCurrent = created.stock_current ?? 0;
    } else {
      if (!materialId) {
        toast({ title: 'Error', description: 'Selecciona un material', variant: 'destructive' });
        return;
      }
      const mat = materials.find(m => m.id === materialId);
      if (!mat) return;
      materialQtyPerPres = mat.quantity_per_presentation || 1;
      materialName = mat.name;
      materialStockCurrent = mat.stock_current;
    }

    const unitsAdded = purchase.quantity_presentations * materialQtyPerPres;
    const newStock = materialStockCurrent + unitsAdded;

    try {
      // 1. Insert purchase record
      const { error: purchaseError } = await supabase.from('material_purchases').insert({
        user_id: user.id,
        material_id: materialId,
        purchase_date: purchase.purchase_date,
        provider: purchase.provider || null,
        quantity_presentations: purchase.quantity_presentations,
        units_added: unitsAdded,
        total_paid: purchase.total_paid,
        notes: purchase.notes || null,
      });
      if (purchaseError) throw purchaseError;

      // 2. Update stock
      const { error: stockError } = await supabase
        .from('user_materials')
        .update({ stock_current: newStock })
        .eq('id', materialId);
      if (stockError) throw stockError;

      // 3. Register expense in finances
      const { error: financeError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: purchase.total_paid,
        description: `Compra de material: ${materialName}${purchase.provider ? ` - ${purchase.provider}` : ''}`,
        category: 'Compras de material',
        transaction_date: purchase.purchase_date,
      });
      if (financeError) throw financeError;

      toast({
        title: 'Compra registrada',
        description: `Se agregaron ${unitsAdded} unidades de ${materialName} y se registró el gasto de ${formatCurrency(purchase.total_paid)}`,
      });

      // Reset
      setPurchase({ material_id: '', purchase_date: new Date().toISOString().split('T')[0], provider: '', quantity_presentations: 1, total_paid: 0, notes: '' });
      setNewMaterial({ name: '', category: '', purchase_unit: '', presentation_price: null, quantity_per_presentation: null, stock_minimum: 0 });
      setPurchaseMode('existing');
      setShowPurchaseDialog(false);
      loadMaterials();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo registrar la compra', variant: 'destructive' });
    }
  };

  const openPurchaseDialog = () => {
    setPurchaseMode(materials.length === 0 ? 'new' : 'existing');
    setShowPurchaseDialog(true);
  };

  const selectedPurchaseMaterial = materials.find(m => m.id === purchase.material_id);
  const purchaseUnitsPreview = purchaseMode === 'existing' && selectedPurchaseMaterial
    ? purchase.quantity_presentations * (selectedPurchaseMaterial.quantity_per_presentation || 1)
    : purchaseMode === 'new' && newMaterial.quantity_per_presentation
    ? purchase.quantity_presentations * newMaterial.quantity_per_presentation
    : purchase.quantity_presentations;

  const lowStockCount = materials.filter(m => m.stock_minimum > 0 && m.stock_current < m.stock_minimum).length;

  if (!user) return null;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Inventario de Consumo</h1>
          <p className="text-muted-foreground text-sm">Materiales no reutilizables</p>
        </div>
        <Button variant="gradient" onClick={openPurchaseDialog} className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          Registrar Compra
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium">
              {lowStockCount} material{lowStockCount > 1 ? 'es' : ''} con stock bajo
            </span>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="pl-10"
        />
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando inventario...</div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchTerm ? 'No se encontraron materiales' : 'No hay materiales registrados'}
            </p>
            {!searchTerm && (
              <Button variant="gradient" className="mt-4" onClick={openPurchaseDialog}>
                <ShoppingCart className="w-4 h-4 mr-2" /> Registrar primera compra
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Material</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Costo/Unidad</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map(m => {
                    const isLow = m.stock_minimum > 0 && m.stock_current < m.stock_minimum;
                    return (
                      <TableRow key={m.id} className={isLow ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {CATEGORIES.find(c => c.value === m.category)?.label || m.category}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-primary">
                          {formatCurrency(m.cost_per_unit)}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold">
                          {m.stock_current}
                        </TableCell>
                        <TableCell className="text-center">
                          {m.stock_minimum > 0 ? (
                            isLow ? (
                              <Badge variant="destructive" className="text-xs">⚠ Bajo</Badge>
                            ) : (
                              <Badge className="bg-profit-high/15 text-profit-high border-0 text-xs">Normal</Badge>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMaterial({ ...m })}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteMaterial(m.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Edit Material Dialog ── */}
      <Dialog open={!!editingMaterial} onOpenChange={open => !open && setEditingMaterial(null)}>
        <DialogContent className="bg-background max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Material</DialogTitle>
          </DialogHeader>
          {editingMaterial && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={editingMaterial.name} onChange={e => setEditingMaterial(p => p ? { ...p, name: e.target.value } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={editingMaterial.category} onValueChange={v => setEditingMaterial(p => p ? { ...p, category: v } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Unidad de compra</Label>
                  <Select value={editingMaterial.purchase_unit} onValueChange={v => setEditingMaterial(p => p ? { ...p, purchase_unit: v } : null)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {PURCHASE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio presentación</Label>
                  <Input type="number" min="0" step="0.01" value={editingMaterial.presentation_price ?? ''} onChange={e => setEditingMaterial(p => p ? { ...p, presentation_price: e.target.value === '' ? null : Number(e.target.value) } : null)} />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad presentación</Label>
                  <Input type="number" min="0" step="1" value={editingMaterial.quantity_per_presentation ?? ''} onChange={e => setEditingMaterial(p => p ? { ...p, quantity_per_presentation: e.target.value === '' ? null : Number(e.target.value) } : null)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Stock mínimo</Label>
                <Input type="number" min="0" value={editingMaterial.stock_minimum} onChange={e => setEditingMaterial(p => p ? { ...p, stock_minimum: Number(e.target.value) || 0 } : null)} />
              </div>
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">Costo por unidad:</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(costPerUnit(editingMaterial.presentation_price, editingMaterial.quantity_per_presentation))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Stock actual: <strong>{editingMaterial.stock_current}</strong> unidades (no editable manualmente)
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMaterial(null)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleUpdateMaterial}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Unified Purchase Dialog ── */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-background max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Toggle: existing vs new material */}
            <Tabs value={purchaseMode} onValueChange={v => setPurchaseMode(v as 'existing' | 'new')}>
              <TabsList className="w-full">
                <TabsTrigger value="existing" className="flex-1" disabled={materials.length === 0}>Material existente</TabsTrigger>
                <TabsTrigger value="new" className="flex-1">
                  <Plus className="w-3 h-3 mr-1" /> Nuevo material
                </TabsTrigger>
              </TabsList>

              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Select value={purchase.material_id} onValueChange={v => setPurchase(p => ({ ...p, material_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar material" /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {materials.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="new" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre del material</Label>
                    <Input value={newMaterial.name} onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={newMaterial.category} onValueChange={v => setNewMaterial(p => ({ ...p, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad de compra</Label>
                    <Select value={newMaterial.purchase_unit} onValueChange={v => setNewMaterial(p => ({ ...p, purchase_unit: v }))}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {PURCHASE_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio presentación</Label>
                    <Input type="number" min="0" step="0.01" value={newMaterial.presentation_price ?? ''} onChange={e => setNewMaterial(p => ({ ...p, presentation_price: e.target.value === '' ? null : Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad presentación</Label>
                    <Input type="number" min="0" step="1" value={newMaterial.quantity_per_presentation ?? ''} onChange={e => setNewMaterial(p => ({ ...p, quantity_per_presentation: e.target.value === '' ? null : Number(e.target.value) }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Stock mínimo (para alertas)</Label>
                  <Input type="number" min="0" value={newMaterial.stock_minimum} onChange={e => setNewMaterial(p => ({ ...p, stock_minimum: Number(e.target.value) || 0 }))} />
                </div>
                {newMaterial.presentation_price && newMaterial.quantity_per_presentation ? (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Costo por unidad:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(costPerUnit(newMaterial.presentation_price, newMaterial.quantity_per_presentation))}
                    </span>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>

            {/* Common purchase fields */}
            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Datos de la compra</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={purchase.purchase_date} onChange={e => setPurchase(p => ({ ...p, purchase_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input value={purchase.provider} onChange={e => setPurchase(p => ({ ...p, provider: e.target.value }))} placeholder="Ej: Amazon, Mercado Libre..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad (presentaciones)</Label>
                  <Input type="number" min="1" value={purchase.quantity_presentations} onChange={e => setPurchase(p => ({ ...p, quantity_presentations: Number(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Total pagado</Label>
                  <Input type="number" min="0" step="0.01" value={purchase.total_paid || ''} onChange={e => setPurchase(p => ({ ...p, total_paid: Number(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-primary/10 rounded-lg space-y-1">
                <p className="text-sm">
                  Unidades reales a agregar: <strong>{purchaseUnitsPreview}</strong>
                </p>
                {purchaseMode === 'existing' && selectedPurchaseMaterial && (
                  <p className="text-sm text-muted-foreground">
                    Stock actual: {selectedPurchaseMaterial.stock_current} → Nuevo: {selectedPurchaseMaterial.stock_current + purchaseUnitsPreview}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nota (opcional)</Label>
                <Textarea value={purchase.notes} onChange={e => setPurchase(p => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPurchaseDialog(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={handleRegisterPurchase}>Registrar Compra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryConsumables;
