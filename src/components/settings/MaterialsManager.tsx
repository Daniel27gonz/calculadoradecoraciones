import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Trash2, Pencil, ShoppingCart, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';
import { format } from 'date-fns';

const UNITS = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'metro', label: 'Metro' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'bolsa', label: 'Bolsa' },
  { value: 'caja', label: 'Caja' },
  { value: 'litro', label: 'Litro' },
  { value: 'kilo', label: 'Kilo' },
];

const CATEGORIES = [
  { value: 'globos', label: 'Globos' },
  { value: 'flores', label: 'Flores' },
  { value: 'telas', label: 'Telas y Manteles' },
  { value: 'velas', label: 'Velas e Iluminación' },
  { value: 'adhesivos', label: 'Adhesivos' },
  { value: 'cintas', label: 'Cintas y Listones' },
  { value: 'vinil', label: 'Vinil' },
  { value: 'otros', label: 'Otros' },
];

interface Material {
  id: string;
  name: string;
  category: string;
  purchase_unit: string;
  stock_minimum: number;
  total_purchased: number; // calculated from purchases
}

interface Purchase {
  id: string;
  material_id: string;
  material_name?: string;
  purchase_date: string;
  quantity_presentations: number;
  total_paid: number;
  cost_per_unit: number;
  provider: string | null;
}

export function MaterialsManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New material form
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', purchase_unit: '', stock_minimum: 0 });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // New purchase form
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    material_id: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    quantity: '',
    total_paid: '',
    provider: '',
  });

  const currency = getCurrencyByCode(profile?.currency || 'USD');
  const fmt = (v: number | null) => v === null ? '-' : `${currency?.symbol || '$'}${v.toFixed(2)}`;

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [matRes, purRes] = await Promise.all([
        supabase.from('user_materials').select('id, name, category, purchase_unit, stock_minimum').eq('user_id', user.id).order('name'),
        supabase.from('material_purchases').select('*').eq('user_id', user.id).order('purchase_date', { ascending: false }),
      ]);

      if (matRes.error) throw matRes.error;
      if (purRes.error) throw purRes.error;

      // Calculate total purchased per material from purchases
      const purchasesByMaterial: Record<string, number> = {};
      (purRes.data || []).forEach(p => {
        purchasesByMaterial[p.material_id] = (purchasesByMaterial[p.material_id] || 0) + p.quantity_presentations;
      });

      setMaterials((matRes.data || []).map(m => ({
        id: m.id,
        name: m.name,
        category: m.category || 'otros',
        purchase_unit: m.purchase_unit || 'pieza',
        stock_minimum: m.stock_minimum || 0,
        total_purchased: purchasesByMaterial[m.id] || 0,
      })));

      setPurchases((purRes.data || []).map(p => ({
        id: p.id,
        material_id: p.material_id,
        purchase_date: p.purchase_date,
        quantity_presentations: p.quantity_presentations,
        total_paid: p.total_paid,
        cost_per_unit: p.quantity_presentations > 0 ? p.total_paid / p.quantity_presentations : 0,
        provider: p.provider,
      })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Material name lookup
  const materialMap = useMemo(() => {
    const map: Record<string, string> = {};
    materials.forEach(m => { map[m.id] = m.name; });
    return map;
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [materials, searchQuery]);

  // ---- Material CRUD ----
  const handleAddMaterial = async () => {
    if (!user || !newMaterial.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es requerido', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('user_materials').insert({
        user_id: user.id,
        name: newMaterial.name.trim(),
        category: newMaterial.category || 'otros',
        purchase_unit: newMaterial.purchase_unit || 'pieza',
        stock_minimum: newMaterial.stock_minimum || 0,
        stock_current: 0,
      });
      if (error) throw error;
      toast({ title: 'Material creado' });
      setNewMaterial({ name: '', category: '', purchase_unit: '', stock_minimum: 0 });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !user) return;
    try {
      const { error } = await supabase.from('user_materials').update({
        name: editingMaterial.name.trim(),
        category: editingMaterial.category || 'otros',
        purchase_unit: editingMaterial.purchase_unit || 'pieza',
        stock_minimum: editingMaterial.stock_minimum || 0,
      }).eq('id', editingMaterial.id);
      if (error) throw error;
      toast({ title: 'Material actualizado' });
      setEditDialogOpen(false);
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from('user_materials').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Material eliminado' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // ---- Purchase CRUD ----
  const handleAddPurchase = async () => {
    if (!user || !newPurchase.material_id) {
      toast({ title: 'Error', description: 'Selecciona un material', variant: 'destructive' });
      return;
    }
    const qty = Number(newPurchase.quantity);
    const paid = Number(newPurchase.total_paid);
    if (!qty || qty <= 0) {
      toast({ title: 'Error', description: 'La cantidad debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    try {
      // Insert purchase
      const { error: pErr } = await supabase.from('material_purchases').insert({
        user_id: user.id,
        material_id: newPurchase.material_id,
        purchase_date: newPurchase.purchase_date,
        quantity_presentations: qty,
        units_added: qty,
        total_paid: paid,
        provider: newPurchase.provider.trim() || null,
      });
      if (pErr) throw pErr;

      // Update stock_current on user_materials (increment)
      const mat = materials.find(m => m.id === newPurchase.material_id);
      if (mat) {
        const newStock = mat.total_purchased + qty;
        await supabase.from('user_materials').update({ stock_current: newStock }).eq('id', mat.id);
      }

      toast({ title: 'Compra registrada', description: `Stock actualizado (+${qty})` });
      setPurchaseDialogOpen(false);
      setNewPurchase({ material_id: '', purchase_date: format(new Date(), 'yyyy-MM-dd'), quantity: '', total_paid: '', provider: '' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeletePurchase = async (purchase: Purchase) => {
    try {
      const { error } = await supabase.from('material_purchases').delete().eq('id', purchase.id);
      if (error) throw error;

      // Decrement stock
      const mat = materials.find(m => m.id === purchase.material_id);
      if (mat) {
        const newStock = Math.max(0, mat.total_purchased - purchase.quantity_presentations);
        await supabase.from('user_materials').update({ stock_current: newStock }).eq('id', mat.id);
      }

      toast({ title: 'Compra eliminada' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const purchaseCostPerUnit = useMemo(() => {
    const qty = Number(newPurchase.quantity);
    const paid = Number(newPurchase.total_paid);
    if (!qty || qty <= 0) return null;
    return paid / qty;
  }, [newPurchase.quantity, newPurchase.total_paid]);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          Inicia sesión para gestionar tu inventario
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="materials" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="materials" className="gap-2">
          <Package className="w-4 h-4" />
          Materiales
        </TabsTrigger>
        <TabsTrigger value="purchases" className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          Compras
        </TabsTrigger>
      </TabsList>

      {/* ===== TAB MATERIALES ===== */}
      <TabsContent value="materials" className="space-y-4 mt-4">
        {/* Add material form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre</Label>
                <Input
                  placeholder="Ej: Globo R12 Rosa"
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoría</Label>
                <Select value={newMaterial.category} onValueChange={(v) => setNewMaterial(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unidad</Label>
                <Select value={newMaterial.purchase_unit} onValueChange={(v) => setNewMaterial(p => ({ ...p, purchase_unit: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  value={newMaterial.stock_minimum || ''}
                  onChange={(e) => setNewMaterial(p => ({ ...p, stock_minimum: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <Button onClick={handleAddMaterial} className="w-full" variant="gradient" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Agregar Material
            </Button>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar material..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Materials list */}
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Cargando...</div>
        ) : filteredMaterials.length > 0 ? (
          <div className="space-y-2">
            {filteredMaterials.map((m) => {
              const isLow = m.total_purchased <= m.stock_minimum;
              return (
                <Card key={m.id} className="overflow-hidden">
                  <div className="flex items-center p-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                          {isLow ? (
                            <><AlertTriangle className="w-3 h-3 mr-0.5" /> Bajo</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3 mr-0.5" /> OK</>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {CATEGORIES.find(c => c.value === m.category)?.label || m.category} · {UNITS.find(u => u.value === m.purchase_unit)?.label || m.purchase_unit}
                      </p>
                      <p className="text-xs mt-1">
                        Stock: <span className={`font-semibold ${isLow ? 'text-destructive' : 'text-foreground'}`}>{m.total_purchased}</span>
                        <span className="text-muted-foreground"> / mín: {m.stock_minimum}</span>
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingMaterial({ ...m }); setEditDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteMaterial(m.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay materiales registrados</p>
          </div>
        )}

        {/* Edit material dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-background">
            <DialogHeader><DialogTitle>Editar Material</DialogTitle></DialogHeader>
            {editingMaterial && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={editingMaterial.name} onChange={(e) => setEditingMaterial(p => p ? { ...p, name: e.target.value } : null)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoría</Label>
                  <Select value={editingMaterial.category} onValueChange={(v) => setEditingMaterial(p => p ? { ...p, category: v } : null)}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Unidad</Label>
                    <Select value={editingMaterial.purchase_unit} onValueChange={(v) => setEditingMaterial(p => p ? { ...p, purchase_unit: v } : null)}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock mínimo</Label>
                    <Input type="number" min="0" value={editingMaterial.stock_minimum || ''} onChange={(e) => setEditingMaterial(p => p ? { ...p, stock_minimum: Number(e.target.value) || 0 } : null)} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="text-muted-foreground">Stock actual (automático): </span>
                  <span className="font-bold">{editingMaterial.total_purchased}</span>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleUpdateMaterial}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* ===== TAB COMPRAS ===== */}
      <TabsContent value="purchases" className="space-y-4 mt-4">
        <Button onClick={() => setPurchaseDialogOpen(true)} className="w-full" variant="gradient">
          <Plus className="w-4 h-4 mr-1" /> Registrar Compra
        </Button>

        {purchases.length > 0 ? (
          <div className="space-y-2">
            {purchases.map(p => (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex items-center p-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{materialMap[p.material_id] || 'Material eliminado'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(p.purchase_date + 'T12:00:00'), 'dd/MM/yyyy')}
                      {p.provider && ` · ${p.provider}`}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span>Cant: <strong>{p.quantity_presentations}</strong></span>
                      <span>Total: <strong>{fmt(p.total_paid)}</strong></span>
                      <span>C/U: <strong>{fmt(p.cost_per_unit)}</strong></span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDeletePurchase(p)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay compras registradas</p>
          </div>
        )}

        {/* New purchase dialog */}
        <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <DialogContent className="bg-background">
            <DialogHeader><DialogTitle>Registrar Compra</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Material</Label>
                <Select value={newPurchase.material_id} onValueChange={(v) => setNewPurchase(p => ({ ...p, material_id: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar material" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={newPurchase.purchase_date} onChange={(e) => setNewPurchase(p => ({ ...p, purchase_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input type="number" min="1" placeholder="0" value={newPurchase.quantity} onChange={(e) => setNewPurchase(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Precio total</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={newPurchase.total_paid} onChange={(e) => setNewPurchase(p => ({ ...p, total_paid: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Proveedor (opcional)</Label>
                <Input placeholder="Nombre del proveedor" value={newPurchase.provider} onChange={(e) => setNewPurchase(p => ({ ...p, provider: e.target.value }))} />
              </div>

              {/* Auto cost per unit */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm">Costo unitario:</span>
                <span className="text-lg font-bold text-primary">
                  {purchaseCostPerUnit !== null ? fmt(purchaseCostPerUnit) : '-'}
                </span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleAddPurchase}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
}
