import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Material } from '@/types/quote';
import { Plus, Trash2 } from 'lucide-react';

const EMOJI_OPTIONS = ['🎈', '🎀', '🏛️', '📸', '🌸', '✨', '🎉', '🎊', '💐', '🌟', '🎁', '🎂'];

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pkg: Package) => void;
  initialPackage?: Package | null;
}

export function PackageFormDialog({ open, onOpenChange, onSave, initialPackage }: PackageFormDialogProps) {
  const [name, setName] = useState(initialPackage?.name || '');
  const [description, setDescription] = useState(initialPackage?.description || '');
  const [icon, setIcon] = useState(initialPackage?.icon || '🎈');
  const [estimatedBalloons, setEstimatedBalloons] = useState(initialPackage?.estimatedBalloons || 0);
  const [estimatedHours, setEstimatedHours] = useState(initialPackage?.estimatedHours || 0);
  const [suggestedPrice, setSuggestedPrice] = useState(initialPackage?.suggestedPrice || 0);
  const [materials, setMaterials] = useState<Material[]>(initialPackage?.estimatedMaterials || []);

  const handleAddMaterial = () => {
    setMaterials([...materials, { id: crypto.randomUUID(), name: '', costPerUnit: 0, quantity: 1 }]);
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleMaterialChange = (id: string, field: keyof Material, value: string | number) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;

    const pkg: Package = {
      id: initialPackage?.id || crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      icon,
      estimatedBalloons,
      estimatedMaterials: materials.filter(m => m.name.trim()),
      estimatedHours,
      suggestedPrice,
    };

    onSave(pkg);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIcon('🎈');
    setEstimatedBalloons(0);
    setEstimatedHours(0);
    setSuggestedPrice(0);
    setMaterials([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialPackage ? 'Editar Paquete' : 'Nuevo Paquete'}</DialogTitle>
          <DialogDescription>
            Crea una plantilla reutilizable para cotizaciones similares.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon selector */}
          <div className="space-y-2">
            <Label>Ícono</Label>
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
              placeholder="Ej: Arco Grande"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente el paquete..."
              rows={2}
            />
          </div>

          {/* Estimates grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="balloons">Globos est.</Label>
              <Input
                id="balloons"
                type="number"
                min="0"
                value={estimatedBalloons}
                onChange={(e) => setEstimatedBalloons(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Horas est.</Label>
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
              <Label htmlFor="price">Precio sug.</Label>
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
              <Button type="button" variant="outline" size="sm" onClick={handleAddMaterial}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar
              </Button>
            </div>
            
            {materials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Sin materiales. Agrega los materiales típicos para este paquete.
              </p>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <Input
                      placeholder="Nombre"
                      value={material.name}
                      onChange={(e) => handleMaterialChange(material.id, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Cant."
                      value={material.quantity}
                      onChange={(e) => handleMaterialChange(material.id, 'quantity', Number(e.target.value))}
                      className="w-20"
                      min="0"
                    />
                    <Input
                      type="number"
                      placeholder="Costo"
                      value={material.costPerUnit}
                      onChange={(e) => handleMaterialChange(material.id, 'costPerUnit', Number(e.target.value))}
                      className="w-24"
                      min="0"
                      step="0.01"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMaterial(material.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              {initialPackage ? 'Guardar cambios' : 'Crear paquete'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
