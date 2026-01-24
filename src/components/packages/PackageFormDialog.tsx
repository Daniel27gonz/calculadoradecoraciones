import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Material } from '@/types/quote';
import { Plus, Trash2 } from 'lucide-react';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: Package | null;
  onSave: (pkg: Package) => void;
}

const ICONS = ['🎈', '🎀', '🏛️', '📸', '🌸', '✨', '🎉', '🎊', '💫', '🌟', '🎁', '💝'];

const emptyPackage: Package = {
  id: '',
  name: '',
  description: '',
  icon: '🎈',
  estimatedBalloons: 0,
  estimatedMaterials: [],
  estimatedHours: 0,
  suggestedPrice: 0,
};

export function PackageFormDialog({ open, onOpenChange, package: editPackage, onSave }: PackageFormDialogProps) {
  const [formData, setFormData] = useState<Package>(emptyPackage);

  useEffect(() => {
    if (editPackage) {
      setFormData(editPackage);
    } else {
      setFormData({ ...emptyPackage, id: crypto.randomUUID() });
    }
  }, [editPackage, open]);

  const handleAddMaterial = () => {
    setFormData(prev => ({
      ...prev,
      estimatedMaterials: [
        ...prev.estimatedMaterials,
        { id: crypto.randomUUID(), name: '', costPerUnit: 0, quantity: 1 }
      ]
    }));
  };

  const handleUpdateMaterial = (index: number, field: keyof Material, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      estimatedMaterials: prev.estimatedMaterials.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      estimatedMaterials: prev.estimatedMaterials.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
    onOpenChange(false);
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
              {ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`w-10 h-10 text-xl rounded-lg border-2 transition-all ${
                    formData.icon === icon 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Arco Orgánico"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción breve del paquete"
              rows={2}
            />
          </div>

          {/* Estimated Balloons */}
          <div className="space-y-2">
            <Label htmlFor="balloons">Globos estimados</Label>
            <Input
              id="balloons"
              type="number"
              min="0"
              value={formData.estimatedBalloons}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedBalloons: Number(e.target.value) }))}
            />
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Horas estimadas</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
            />
          </div>

          {/* Suggested Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Precio sugerido</Label>
            <Input
              id="price"
              type="number"
              min="0"
              value={formData.suggestedPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, suggestedPrice: Number(e.target.value) }))}
            />
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Materiales estimados</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {formData.estimatedMaterials.map((material, index) => (
                <div key={material.id} className="flex gap-2 items-center">
                  <Input
                    placeholder="Nombre"
                    value={material.name}
                    onChange={(e) => handleUpdateMaterial(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Costo"
                    value={material.costPerUnit}
                    onChange={(e) => handleUpdateMaterial(index, 'costPerUnit', Number(e.target.value))}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Cant"
                    value={material.quantity}
                    onChange={(e) => handleUpdateMaterial(index, 'quantity', Number(e.target.value))}
                    className="w-16"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {formData.estimatedMaterials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin materiales. Haz clic en "Agregar" para añadir.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
