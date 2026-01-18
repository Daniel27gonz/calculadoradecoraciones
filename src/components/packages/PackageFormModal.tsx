import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { Package, Material } from '@/types/quote';

const EMOJI_OPTIONS = ['🎈', '🎀', '🏛️', '📸', '🌸', '✨', '🎉', '🎊', '💐', '🌟', '🎁', '🎯'];

interface PackageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: Package | null;
  onSave: (pkg: Package) => void;
}

export function PackageFormModal({ open, onOpenChange, package: editPackage, onSave }: PackageFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎈');
  const [estimatedBalloons, setEstimatedBalloons] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [suggestedPrice, setSuggestedPrice] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editPackage) {
      setName(editPackage.name);
      setDescription(editPackage.description);
      setIcon(editPackage.icon);
      setEstimatedBalloons(editPackage.estimatedBalloons);
      setEstimatedHours(editPackage.estimatedHours);
      setSuggestedPrice(editPackage.suggestedPrice);
      setMaterials(editPackage.estimatedMaterials || []);
    } else {
      resetForm();
    }
  }, [editPackage, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('🎈');
    setEstimatedBalloons(0);
    setEstimatedHours(0);
    setSuggestedPrice(0);
    setMaterials([]);
  };

  const addMaterial = () => {
    setMaterials([...materials, { id: crypto.randomUUID(), name: '', costPerUnit: 0, quantity: 1 }]);
  };

  const updateMaterial = (index: number, field: keyof Material, value: string | number) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsSubmitting(true);
    try {
      const pkg: Package = {
        id: editPackage?.id || crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        icon,
        estimatedBalloons,
        estimatedHours,
        suggestedPrice,
        estimatedMaterials: materials.filter(m => m.name.trim()),
      };
      
      await onSave(pkg);
      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPackage ? 'Editar Paquete' : 'Nuevo Paquete'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Icon selector */}
          <div className="space-y-2">
            <Label>Icono</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    icon === emoji 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del paquete *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Arco Orgánico"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el paquete..."
              rows={2}
            />
          </div>

          {/* Estimates grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="balloons">Globos estimados</Label>
              <Input
                id="balloons"
                type="number"
                min="0"
                value={estimatedBalloons}
                onChange={(e) => setEstimatedBalloons(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Horas estimadas</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Precio sugerido</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={suggestedPrice}
                onChange={(e) => setSuggestedPrice(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Materiales estimados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sin materiales estimados
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((material, index) => (
                  <div key={material.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Nombre"
                      value={material.name}
                      onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      value={material.costPerUnit}
                      onChange={(e) => updateMaterial(index, 'costPerUnit', Number(e.target.value))}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                      className="w-16"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMaterial(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Guardando...' : (editPackage ? 'Guardar cambios' : 'Crear paquete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
