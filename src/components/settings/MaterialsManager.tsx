import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Trash2, Pencil, ShoppingCart, AlertTriangle, CheckCircle2, Search, ClipboardList, ChevronLeft, ChevronRight, CalendarIcon, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  units_added: number;
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

  // Month selector state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(now.getFullYear());

  // New material form
  const [newMaterial, setNewMaterial] = useState({ name: '', category: '', purchase_unit: '', stock_minimum: 0 });
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Purchase form
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [newPurchase, setNewPurchase] = useState({
    material_id: '',
    purchase_date: format(new Date(), 'yyyy-MM-dd'),
    purchase_unit: '',
    presentation_price: '',
    quantity: '',
    quantity_bought: '',
    provider: '',
  });

  // Quick purchase from material card
  const [quickPurchaseDialogOpen, setQuickPurchaseDialogOpen] = useState(false);
  const [quickPurchaseMaterial, setQuickPurchaseMaterial] = useState<Material | null>(null);
  const [quickPurchase, setQuickPurchase] = useState({ price: '', quantity: '' });

  // Create new material inline from purchases tab
  const [isCreatingNewMaterial, setIsCreatingNewMaterial] = useState(false);
  const [newMatInline, setNewMatInline] = useState({ name: '', category: 'otros', purchase_unit: 'pieza' });
  const [purchaseMaterialSearch, setPurchaseMaterialSearch] = useState('');

  const [deductions, setDeductions] = useState<Record<string, number>>({});

  const currency = getCurrencyByCode(profile?.currency || 'USD');
  const fmt = (v: number | null) => v === null ? '-' : `${currency?.symbol || '$'}${v.toFixed(2)}`;

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [matRes, purRes, dedRes] = await Promise.all([
        supabase.from('user_materials').select('id, name, category, purchase_unit, stock_minimum, presentation_price').eq('user_id', user.id).order('name'),
        supabase.from('material_purchases').select('*').eq('user_id', user.id).order('purchase_date', { ascending: false }),
        supabase.from('stock_deductions').select('material_id, quantity_deducted').eq('user_id', user.id),
      ]);

      if (matRes.error) throw matRes.error;
      if (purRes.error) throw purRes.error;

      // Calculate deductions per material
      const deductionsByMaterial: Record<string, number> = {};
      (dedRes.data || []).forEach(d => {
        deductionsByMaterial[d.material_id] = (deductionsByMaterial[d.material_id] || 0) + Number(d.quantity_deducted);
      });
      setDeductions(deductionsByMaterial);

      // Calculate total purchased per material from purchases
      const purchasesByMaterial: Record<string, number> = {};
      (purRes.data || []).forEach(p => {
        purchasesByMaterial[p.material_id] = (purchasesByMaterial[p.material_id] || 0) + p.units_added;
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
        units_added: p.units_added,
        total_paid: p.total_paid,
        cost_per_unit: p.units_added > 0 ? p.total_paid / p.units_added : 0,
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

  // Material presentation_price lookup
  const materialPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    materials.forEach(m => { map[m.id] = (m as any).presentation_price || 0; });
    return map;
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    const q = searchQuery.toLowerCase();
    return materials.filter(m => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [materials, searchQuery]);

  // Filter purchases by selected month/year
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const d = new Date(p.purchase_date + 'T12:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [purchases, selectedMonth, selectedYear]);

  // Helper: get default date for selected month
  const getDefaultDateForMonth = () => {
    const today = new Date();
    if (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) {
      return format(today, 'yyyy-MM-dd');
    }
    return format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-dd');
  };

  const selectedMonthLabel = format(new Date(selectedYear, selectedMonth, 1), "MMMM yyyy", { locale: es });

  const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
    const qtyBought = Number(newPurchase.quantity_bought) || 1;
    const presPrice = Number(newPurchase.presentation_price);
    const paid = presPrice * qtyBought;
    const totalUnits = qty * qtyBought;
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
        quantity_presentations: qtyBought,
        units_added: totalUnits,
        total_paid: paid,
        provider: newPurchase.provider.trim() || null,
      });
      if (pErr) throw pErr;

      // Update stock_current on user_materials (increment)
      const mat = materials.find(m => m.id === newPurchase.material_id);
      if (mat) {
        const newStock = mat.total_purchased + totalUnits;
        const costPerUnit = totalUnits > 0 ? paid / totalUnits : 0;
        await supabase.from('user_materials').update({ stock_current: newStock, cost_per_unit: costPerUnit }).eq('id', mat.id);
      }

      // Register expense in finances
      const matName = mat?.name || materialMap[newPurchase.material_id] || 'Material';
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: paid,
        description: `Compra material: ${matName}`,
        category: 'Materiales',
        transaction_date: newPurchase.purchase_date,
      });

      toast({ title: 'Compra registrada', description: `Stock actualizado (+${qty}) y gasto registrado` });
      setPurchaseDialogOpen(false);
      setNewPurchase({ material_id: '', purchase_date: getDefaultDateForMonth(), purchase_unit: '', presentation_price: '', quantity: '', quantity_bought: '', provider: '' });
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

      // Delete corresponding expense from finances
      const matName = mat?.name || materialMap[purchase.material_id] || 'Material';
      await supabase.from('transactions').delete()
        .eq('user_id', user!.id)
        .eq('description', `Compra material: ${matName}`)
        .eq('amount', purchase.total_paid)
        .eq('transaction_date', purchase.purchase_date);

      toast({ title: 'Compra eliminada', description: 'Gasto eliminado de finanzas' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    const mat = materials.find(m => m.id === purchase.material_id);
    setNewPurchase({
      material_id: purchase.material_id,
      purchase_date: purchase.purchase_date,
      purchase_unit: mat?.purchase_unit || '',
      presentation_price: String(materialPriceMap[purchase.material_id] || (purchase.quantity_presentations > 0 ? purchase.total_paid / purchase.quantity_presentations : 0)),
      quantity: String(purchase.quantity_presentations > 0 ? purchase.units_added / purchase.quantity_presentations : 0),
      quantity_bought: String(purchase.quantity_presentations),
      provider: purchase.provider || '',
    });
    setNewMatInline(p => ({ ...p, name: mat?.name || '', category: mat?.category || 'otros' }));
    setPurchaseMaterialSearch('');
    setPurchaseDialogOpen(true);
  };

  const handleUpdatePurchase = async () => {
    if (!user || !editingPurchase) return;
    const qty = Number(newPurchase.quantity);
    const qtyBought = Number(newPurchase.quantity_bought);
    const presPrice = Number(newPurchase.presentation_price);
    if (!qtyBought || qtyBought <= 0) {
      toast({ title: 'Error', description: 'El campo "¿Cuánto compraste?" es obligatorio', variant: 'destructive' });
      return;
    }
    const paid = presPrice * qtyBought;
    const totalUnits = qty * qtyBought;
    if (!qty || qty <= 0) {
      toast({ title: 'Error', description: 'La cantidad de piezas debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase.from('material_purchases').update({
        material_id: newPurchase.material_id,
        purchase_date: newPurchase.purchase_date,
        quantity_presentations: qtyBought,
        units_added: totalUnits,
        total_paid: paid,
        provider: newPurchase.provider.trim() || null,
      }).eq('id', editingPurchase.id);
      if (error) throw error;

      // Update corresponding expense: delete old, insert new
      const oldMatName = materialMap[editingPurchase.material_id] || 'Material';
      await supabase.from('transactions').delete()
        .eq('user_id', user.id)
        .eq('description', `Compra material: ${oldMatName}`)
        .eq('amount', editingPurchase.total_paid)
        .eq('transaction_date', editingPurchase.purchase_date);

      const newMatName = materialMap[newPurchase.material_id] || 'Material';
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: paid,
        description: `Compra material: ${newMatName}`,
        category: 'Materiales',
        transaction_date: newPurchase.purchase_date,
      });

      toast({ title: 'Compra actualizada', description: 'Gasto actualizado en finanzas' });
      setPurchaseDialogOpen(false);
      setEditingPurchase(null);
      setNewPurchase({ material_id: '', purchase_date: getDefaultDateForMonth(), purchase_unit: '', presentation_price: '', quantity: '', quantity_bought: '', provider: '' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const purchaseTotalPaid = useMemo(() => {
    const qtyBought = Number(newPurchase.quantity_bought) || 1;
    const presPrice = Number(newPurchase.presentation_price);
    if (!presPrice || presPrice <= 0) return null;
    return presPrice * qtyBought;
  }, [newPurchase.quantity_bought, newPurchase.presentation_price]);

  const purchaseCostPerUnit = useMemo(() => {
    const presPrice = Number(newPurchase.presentation_price);
    const qty = Number(newPurchase.quantity);
    if (!presPrice || presPrice <= 0 || !qty || qty <= 0) return null;
    return presPrice / qty;
  }, [newPurchase.presentation_price, newPurchase.quantity]);

  // Filtered materials for purchase dialog search
  const filteredPurchaseMaterials = useMemo(() => {
    if (!purchaseMaterialSearch.trim()) return materials;
    const q = purchaseMaterialSearch.toLowerCase();
    return materials.filter(m => m.name.toLowerCase().includes(q));
  }, [materials, purchaseMaterialSearch]);

  const materialExistsForSearch = useMemo(() => {
    if (!purchaseMaterialSearch.trim()) return true;
    const q = purchaseMaterialSearch.toLowerCase().trim();
    return materials.some(m => m.name.toLowerCase() === q);
  }, [materials, purchaseMaterialSearch]);

  // Quick purchase total
  const quickPurchaseTotal = useMemo(() => {
    const qty = Number(quickPurchase.quantity);
    const price = Number(quickPurchase.price);
    if (!qty || qty <= 0 || !price) return null;
    return price * qty;
  }, [quickPurchase.quantity, quickPurchase.price]);

  // ---- Quick purchase from material card ----
  const openQuickPurchase = (mat: Material) => {
    setQuickPurchaseMaterial(mat);
    setQuickPurchase({ price: '', quantity: '' });
    setQuickPurchaseDialogOpen(true);
  };

  const handleQuickPurchase = async () => {
    if (!user || !quickPurchaseMaterial) return;
    const qty = Number(quickPurchase.quantity);
    const price = Number(quickPurchase.price);
    const total = price * qty;
    if (!qty || qty <= 0 || !price || price <= 0) {
      toast({ title: 'Error', description: 'Completa precio y cantidad', variant: 'destructive' });
      return;
    }
    try {
      await supabase.from('material_purchases').insert({
        user_id: user.id,
        material_id: quickPurchaseMaterial.id,
        purchase_date: getDefaultDateForMonth(),
        quantity_presentations: qty,
        units_added: qty,
        total_paid: total,
      });
      const newStock = quickPurchaseMaterial.total_purchased + qty;
      await supabase.from('user_materials').update({ stock_current: newStock }).eq('id', quickPurchaseMaterial.id);
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: total,
        description: `Compra material: ${quickPurchaseMaterial.name}`,
        category: 'Materiales',
        transaction_date: getDefaultDateForMonth(),
      });
      toast({ title: 'Compra registrada ✅', description: `+${qty} ${quickPurchaseMaterial.name} · Gasto registrado` });
      setQuickPurchaseDialogOpen(false);
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // ---- Create material (or reuse existing) + purchase in one action ----
  const handleCreateMaterialAndPurchase = async () => {
    if (!user) return;
    const name = newMatInline.name.trim();
    if (!name) {
      toast({ title: 'Error', description: 'El nombre del material es requerido', variant: 'destructive' });
      return;
    }
    const qty = Number(newPurchase.quantity);
    const qtyBought = Number(newPurchase.quantity_bought);
    const presPrice = Number(newPurchase.presentation_price);
    if (!qtyBought || qtyBought <= 0) {
      toast({ title: 'Error', description: 'El campo "¿Cuánto compraste?" es obligatorio', variant: 'destructive' });
      return;
    }
    const paid = presPrice * qtyBought;
    const totalUnits = qty * qtyBought;
    if (!qty || qty <= 0) {
      toast({ title: 'Error', description: 'La cantidad de piezas debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    try {
      // Check if material already exists
      const existing = materials.find(m => m.name.toLowerCase() === name.toLowerCase());
      let materialId: string;
      let isNew = false;

      if (existing) {
        materialId = existing.id;
        // Update stock
        const newStock = existing.total_purchased + totalUnits;
        await supabase.from('user_materials').update({ stock_current: newStock }).eq('id', materialId);
      } else {
        // Create material
        const { data: matData, error: matErr } = await supabase.from('user_materials').insert({
          user_id: user.id,
          name,
          category: newMatInline.category,
          purchase_unit: newPurchase.purchase_unit || newMatInline.purchase_unit,
          stock_minimum: 0,
          stock_current: totalUnits,
        }).select('id').single();
        if (matErr) throw matErr;
        materialId = matData.id;
        isNew = true;
      }

      // Register purchase
      await supabase.from('material_purchases').insert({
        user_id: user.id,
        material_id: materialId,
        purchase_date: newPurchase.purchase_date,
        quantity_presentations: qtyBought,
        units_added: totalUnits,
        total_paid: paid,
        provider: newPurchase.provider.trim() || null,
      });

      // Register expense
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: paid,
        description: `Compra material: ${name}`,
        category: 'Materiales',
        transaction_date: newPurchase.purchase_date,
      });

      toast({ title: isNew ? 'Material creado y compra registrada ✅' : 'Compra registrada ✅', description: `${name} · ${totalUnits} unidades · Gasto registrado` });
      setPurchaseDialogOpen(false);
      setIsCreatingNewMaterial(false);
      setNewMatInline({ name: '', category: 'otros', purchase_unit: 'pieza' });
      setPurchaseMaterialSearch('');
      setNewPurchase({ material_id: '', purchase_date: getDefaultDateForMonth(), purchase_unit: '', presentation_price: '', quantity: '', quantity_bought: '', provider: '' });
      loadAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

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
    <div className="space-y-4">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <Package className="w-6 h-6 text-primary" />
        Materiales
      </h1>

      {/* Month selector with calendar icon */}
      <Popover open={monthPickerOpen} onOpenChange={(open) => { setMonthPickerOpen(open); if (open) setPickerYear(selectedYear); }}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between capitalize font-semibold h-11">
            <span className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              {selectedMonthLabel}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-background" align="start">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm">{pickerYear}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPickerYear(y => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_NAMES.map((name, idx) => (
              <button
                key={idx}
                onClick={() => { setSelectedMonth(idx); setSelectedYear(pickerYear); setMonthPickerOpen(false); }}
                className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  idx === selectedMonth && pickerYear === selectedYear
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

    <Tabs defaultValue="purchases" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="purchases" className="gap-1 text-xs sm:text-sm justify-start">
          <ShoppingCart className="w-4 h-4 shrink-0" />
          Compras
        </TabsTrigger>
        <TabsTrigger value="stock" className="gap-1 text-xs sm:text-sm justify-start">
          <ClipboardList className="w-4 h-4 shrink-0" />
          Existencias
        </TabsTrigger>
      </TabsList>

      {/* Edit material dialog (kept for editing from other places) */}
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

      {/* ===== TAB COMPRAS ===== */}
      <TabsContent value="purchases" className="space-y-4 mt-4">
        {/* Total del mes */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">Total compras del mes</span>
          <span className="text-lg font-bold text-primary">
            {fmt(filteredPurchases.reduce((sum, p) => sum + p.total_paid, 0))}
          </span>
        </div>

        <Button onClick={() => { setEditingPurchase(null); setNewPurchase({ material_id: '', purchase_date: getDefaultDateForMonth(), purchase_unit: '', presentation_price: '', quantity: '', quantity_bought: '', provider: '' }); setPurchaseDialogOpen(true); }} className="w-full" variant="gradient">
          <Plus className="w-4 h-4 mr-1" /> Registrar Compra
        </Button>

        {filteredPurchases.length > 0 ? (
          <div className="space-y-2">
            {filteredPurchases.map(p => (
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
                      <span>Costo/presentación: <strong>{fmt(p.cost_per_unit)}</strong></span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPurchase(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeletePurchase(p)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay compras en {selectedMonthLabel}</p>
          </div>
        )}

        {/* New purchase dialog */}
        <Dialog open={purchaseDialogOpen} onOpenChange={(open) => { setPurchaseDialogOpen(open); if (!open) { setIsCreatingNewMaterial(false); setPurchaseMaterialSearch(''); } }}>
          <DialogContent className="bg-background max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingPurchase ? 'Editar Compra' : 'Registrar Compra'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {/* Material name input with search */}
              <div className="space-y-1">
                <Label className="text-xs">Material</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar o escribir nombre del material"
                    value={newMatInline.name}
                    onChange={(e) => {
                      setNewMatInline(p => ({ ...p, name: e.target.value }));
                      setPurchaseMaterialSearch(e.target.value);
                    }}
                    className="pl-8"
                  />
                </div>
                {/* Suggestions dropdown */}
                {newMatInline.name.trim() && filteredPurchaseMaterials.length > 0 && !materials.some(m => m.name.toLowerCase() === newMatInline.name.toLowerCase().trim()) && (
                  <div className="border rounded-md bg-background max-h-32 overflow-y-auto shadow-sm">
                    {filteredPurchaseMaterials.slice(0, 5).map(m => (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
                        onClick={() => {
                          setNewMatInline(p => ({ ...p, name: m.name, category: m.category }));
                          setNewPurchase(p => ({ ...p, material_id: m.id, purchase_unit: m.purchase_unit }));
                          setPurchaseMaterialSearch('');
                        }}
                      >
                        <span>{m.name}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{CATEGORIES.find(c => c.value === m.category)?.label || m.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {newMatInline.name.trim() && materials.some(m => m.name.toLowerCase() === newMatInline.name.toLowerCase().trim()) && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Material encontrado, se actualizará su stock</p>
                )}
                {newMatInline.name.trim() && !materials.some(m => m.name.toLowerCase().includes(newMatInline.name.toLowerCase().trim())) && (
                  <p className="text-xs text-muted-foreground">Material nuevo, se creará automáticamente</p>
                )}
                <Label className="text-xs">Categoría</Label>
                <Select value={newMatInline.category} onValueChange={(v) => setNewMatInline(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={newPurchase.purchase_date} onChange={(e) => setNewPurchase(p => ({ ...p, purchase_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">¿Cómo lo compraste?</Label>
                  <Select value={newPurchase.purchase_unit || (isCreatingNewMaterial ? newMatInline.purchase_unit : '')} onValueChange={(v) => { setNewPurchase(p => ({ ...p, purchase_unit: v })); if (isCreatingNewMaterial) setNewMatInline(p => ({ ...p, purchase_unit: v })); }}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Cuánto compraste?</Label>
                  <Input type="number" min="1" placeholder="0" value={newPurchase.quantity_bought} onChange={(e) => setNewPurchase(p => ({ ...p, quantity_bought: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">¿Cuánto te costó?</Label>
                  <Input type="number" min="0" step="0.01" placeholder="0.00" value={newPurchase.presentation_price} onChange={(e) => setNewPurchase(p => ({ ...p, presentation_price: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">¿Cuántas piezas trae la presentación?</Label>
                  <Input type="number" min="1" placeholder="0" value={newPurchase.quantity} onChange={(e) => setNewPurchase(p => ({ ...p, quantity: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Total Pagado</Label>
                  <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-semibold">
                    {purchaseTotalPaid !== null ? fmt(purchaseTotalPaid) : '-'}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Proveedor (opcional)</Label>
                <Input placeholder="Nombre del proveedor" value={newPurchase.provider} onChange={(e) => setNewPurchase(p => ({ ...p, provider: e.target.value }))} />
              </div>

              {/* Auto cost per unit */}
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm">Costo por presentación:</span>
                <span className="text-lg font-bold text-primary">
                  {purchaseCostPerUnit !== null ? fmt(purchaseCostPerUnit) : '-'}
                </span>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancelar</Button>
              {editingPurchase ? (
                <Button variant="gradient" onClick={handleUpdatePurchase} disabled={!Number(newPurchase.quantity_bought)}>Guardar</Button>
              ) : (
                <Button variant="gradient" onClick={handleCreateMaterialAndPurchase} disabled={!newMatInline.name.trim() || !Number(newPurchase.quantity_bought)}>Registrar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick purchase dialog (from material card) */}
        <Dialog open={quickPurchaseDialogOpen} onOpenChange={setQuickPurchaseDialogOpen}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle>Registrar Compra</DialogTitle>
              {quickPurchaseMaterial && (
                <p className="text-sm text-muted-foreground mt-1">{quickPurchaseMaterial.name}</p>
              )}
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Precio pagado (por unidad)</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={quickPurchase.price} onChange={(e) => setQuickPurchase(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cantidad comprada</Label>
                <Input type="number" min="1" placeholder="0" value={quickPurchase.quantity} onChange={(e) => setQuickPurchase(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              {quickPurchaseTotal !== null && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm">Total a registrar:</span>
                  <span className="text-lg font-bold text-primary">{fmt(quickPurchaseTotal)}</span>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setQuickPurchaseDialogOpen(false)}>Cancelar</Button>
              <Button variant="gradient" onClick={handleQuickPurchase}>Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* ===== TAB CONTROL DE EXISTENCIA ===== */}
      <TabsContent value="stock" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Control de Existencia
            </CardTitle>
            <CardDescription className="text-xs">
              Stock real = Total comprado − Usado en pedidos confirmados
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {materials.length > 0 ? (
              <div className="divide-y">
                {materials.map((m, index) => {
                  const totalDeducted = deductions[m.id] || 0;
                  const stockReal = m.total_purchased - totalDeducted;
                  const isLow = stockReal <= m.stock_minimum;
                  const unitLabel = UNITS.find(u => u.value === m.purchase_unit)?.label || m.purchase_unit;

                  return (
                    <div key={m.id} className="p-3 hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{index + 1}. {m.name}</p>
                          <p className="text-xs text-muted-foreground">{unitLabel}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {isLow ? (
                              <><AlertTriangle className="w-3 h-3 mr-0.5" /> Bajo</>
                            ) : (
                              <><CheckCircle2 className="w-3 h-3 mr-0.5" /> OK</>
                            )}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingMaterial(m); setEditDialogOpen(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMaterial(m.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-1.5 text-xs">
                        <span className="text-green-600 font-semibold">Entrada: {m.total_purchased} pzas</span>
                        <span className="text-orange-600 font-semibold">Salida: {totalDeducted} pzas</span>
                        <span className={`font-bold ${isLow ? 'text-destructive' : 'text-primary'}`}>
                          Existencia: {stockReal} pzas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No hay materiales registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    </div>
  );
}
