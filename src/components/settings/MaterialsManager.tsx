import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Save, Package, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencyByCode } from '@/lib/currencies';

interface Material {
  id: string;
  name: string;
  price: number;
  category: string;
  is_custom: boolean;
}

const DEFAULT_MATERIALS = [
  { name: 'Globos de látex (paquete 100)', category: 'globos', price: 10 },
  { name: 'Globos metálicos', category: 'globos', price: 3 },
  { name: 'Cinta para globos (rollo)', category: 'accesorios', price: 5 },
  { name: 'Base para arco', category: 'estructuras', price: 25 },
  { name: 'Inflador eléctrico', category: 'herramientas', price: 50 },
  { name: 'Estructura metálica', category: 'estructuras', price: 30 },
  { name: 'Pegamento para globos', category: 'accesorios', price: 8 },
  { name: 'Bomba manual', category: 'herramientas', price: 5 },
  { name: 'Tira de arco plástica', category: 'estructuras', price: 12 },
  { name: 'Helio (tanque pequeño)', category: 'gases', price: 40 },
];

export function MaterialsManager() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    updates: Material[];
    deletes: string[];
    adds: Omit<Material, 'id'>[];
  }>({ updates: [], deletes: [], adds: [] });

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  useEffect(() => {
    if (user) {
      loadMaterials();
    }
  }, [user]);

  const loadMaterials = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      if (data && data.length > 0) {
        setMaterials(data.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price || 0,
          category: m.category,
          is_custom: m.is_custom || false
        })));
      } else {
        // Initialize with default materials for new users
        const defaultMats = DEFAULT_MATERIALS.map((m, index) => ({
          id: `temp-${index}`,
          name: m.name,
          price: m.price,
          category: m.category,
          is_custom: false
        }));
        setMaterials(defaultMats);
        // Auto-save defaults for new users
        await initializeDefaultMaterials();
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los materiales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultMaterials = async () => {
    if (!user) return;
    
    try {
      const materialsToInsert = DEFAULT_MATERIALS.map(m => ({
        user_id: user.id,
        name: m.name,
        price: m.price,
        category: m.category,
        is_custom: false
      }));

      const { data, error } = await supabase
        .from('user_materials')
        .insert(materialsToInsert)
        .select();

      if (error) throw error;

      if (data) {
        setMaterials(data.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price || 0,
          category: m.category,
          is_custom: m.is_custom || false
        })));
      }
    } catch (error) {
      console.error('Error initializing materials:', error);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setEditName(material.name);
    setEditPrice(material.price);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice(0);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "El nombre no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, name: editName.trim(), price: editPrice } : m
    ));

    setPendingChanges(prev => {
      const existingUpdate = prev.updates.find(u => u.id === id);
      const material = materials.find(m => m.id === id);
      if (existingUpdate) {
        return {
          ...prev,
          updates: prev.updates.map(u => 
            u.id === id ? { ...u, name: editName.trim(), price: editPrice } : u
          )
        };
      }
      return {
        ...prev,
        updates: [...prev.updates, { 
          id, 
          name: editName.trim(), 
          price: editPrice,
          category: material?.category || 'otros',
          is_custom: material?.is_custom || false
        }]
      };
    });

    setHasChanges(true);
    setEditingId(null);
    setEditName('');
    setEditPrice(0);
  };

  const handleDelete = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    
    if (!id.startsWith('temp-') && !id.startsWith('new-')) {
      setPendingChanges(prev => ({
        ...prev,
        deletes: [...prev.deletes, id],
        updates: prev.updates.filter(u => u.id !== id)
      }));
    } else {
      setPendingChanges(prev => ({
        ...prev,
        adds: prev.adds.filter((_, i) => `new-${i}` !== id)
      }));
    }
    
    setHasChanges(true);
  };

  const handleAddMaterial = () => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "El nombre no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    const newMaterial: Material = {
      id: `new-${Date.now()}`,
      name: newName.trim(),
      price: newPrice,
      category: 'personalizado',
      is_custom: true
    };

    setMaterials(prev => [...prev, newMaterial]);
    setPendingChanges(prev => ({
      ...prev,
      adds: [...prev.adds, {
        name: newName.trim(),
        price: newPrice,
        category: 'personalizado',
        is_custom: true
      }]
    }));

    setNewName('');
    setNewPrice(0);
    setShowAddForm(false);
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Process deletes
      if (pendingChanges.deletes.length > 0) {
        const { error } = await supabase
          .from('user_materials')
          .delete()
          .in('id', pendingChanges.deletes);
        if (error) throw error;
      }

      // Process updates
      for (const update of pendingChanges.updates) {
        const { error } = await supabase
          .from('user_materials')
          .update({ name: update.name, price: update.price })
          .eq('id', update.id);
        if (error) throw error;
      }

      // Process adds
      if (pendingChanges.adds.length > 0) {
        const materialsToAdd = pendingChanges.adds.map(m => ({
          user_id: user.id,
          name: m.name,
          price: m.price,
          category: m.category,
          is_custom: m.is_custom
        }));

        const { error } = await supabase
          .from('user_materials')
          .insert(materialsToAdd);
        if (error) throw error;
      }

      toast({
        title: "¡Guardado!",
        description: "Tus materiales han sido actualizados correctamente",
      });

      setPendingChanges({ updates: [], deletes: [], adds: [] });
      setHasChanges(false);
      
      // Reload to get fresh data with real IDs
      await loadMaterials();
    } catch (error) {
      console.error('Error saving materials:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center">
              <Package className="w-5 h-5 text-rose-dark" />
            </div>
            <div>
              <CardTitle className="text-lg">Lista de materiales</CardTitle>
              <CardDescription>
                Gestiona tus materiales y precios
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">
              Inicia sesión para gestionar tu lista de materiales
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-light flex items-center justify-center">
              <Package className="w-5 h-5 text-rose-dark" />
            </div>
            <div>
              <CardTitle className="text-lg">Lista de materiales</CardTitle>
              <CardDescription>
                Gestiona tus materiales y precios
              </CardDescription>
            </div>
          </div>
          {hasChanges && (
            <Button 
              variant="gradient" 
              size="sm"
              onClick={handleSaveAll}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Cargando materiales...</p>
          </div>
        ) : (
          <>
            {/* Materials List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  {editingId === material.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-9"
                        placeholder="Nombre del material"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">{currencySymbol}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                          className="w-20 h-9"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleSaveEdit(material.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{material.name}</p>
                        {material.is_custom && (
                          <span className="text-xs text-muted-foreground">Personalizado</span>
                        )}
                      </div>
                      <span className="font-semibold text-primary whitespace-nowrap">
                        {currencySymbol}{material.price.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(material)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {materials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay materiales en tu lista</p>
                  <p className="text-sm">Agrega tu primer material</p>
                </div>
              )}
            </div>

            {/* Add New Material Form */}
            {showAddForm ? (
              <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-rose-light/20 space-y-3">
                <p className="font-medium text-sm">Nuevo material</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1"
                    placeholder="Nombre del material"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{currencySymbol}</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      className="w-24"
                      placeholder="Precio"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" size="sm" onClick={handleAddMaterial}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowAddForm(false);
                      setNewName('');
                      setNewPrice(0);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar nuevo material
              </Button>
            )}

            {/* Save Button (fixed at bottom when there are changes) */}
            {hasChanges && (
              <div className="pt-4 border-t border-border">
                <Button 
                  variant="gradient" 
                  className="w-full"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando cambios...' : 'Guardar todos los cambios'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Tienes cambios sin guardar
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
