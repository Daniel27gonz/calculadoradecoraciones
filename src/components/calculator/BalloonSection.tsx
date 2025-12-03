import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Balloon } from '@/types/quote';

interface BalloonSectionProps {
  balloons: Balloon[];
  onChange: (balloons: Balloon[]) => void;
  simplified?: boolean;
}

const balloonTypes = [
  { value: 'latex', label: 'Látex' },
  { value: 'foil', label: 'Foil' },
  { value: 'metallic', label: 'Metálico' },
  { value: 'custom', label: 'Personalizado' },
];

const balloonSizes = ['5"', '10"', '12"', '18"'];

export function BalloonSection({ balloons, onChange, simplified }: BalloonSectionProps) {
  const addBalloon = () => {
    onChange([
      ...balloons,
      { id: crypto.randomUUID(), type: 'latex', size: '12"', pricePerUnit: 0.5, quantity: 10 },
    ]);
  };

  const updateBalloon = (id: string, updates: Partial<Balloon>) => {
    onChange(balloons.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBalloon = (id: string) => {
    onChange(balloons.filter(b => b.id !== id));
  };

  const total = balloons.reduce((sum, b) => sum + b.pricePerUnit * b.quantity, 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🎈</span>
            Globos
          </CardTitle>
          <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {balloons.map((balloon, index) => (
          <div
            key={balloon.id}
            className="p-4 rounded-xl bg-rose-light/30 space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Globo #{index + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeBalloon(balloon.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!simplified && (
                <Select
                  value={balloon.type}
                  onValueChange={(value) => updateBalloon(balloon.id, { type: value as Balloon['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {balloonTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!simplified && (
                <Select
                  value={balloon.size}
                  onValueChange={(value) => updateBalloon(balloon.id, { size: value as Balloon['size'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {balloonSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Precio/unidad</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balloon.pricePerUnit}
                  onChange={(e) => updateBalloon(balloon.id, { pricePerUnit: Number(e.target.value) })}
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input
                  type="number"
                  min="0"
                  value={balloon.quantity}
                  onChange={(e) => updateBalloon(balloon.id, { quantity: Number(e.target.value) })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-sm font-semibold text-primary">
                Subtotal: ${(balloon.pricePerUnit * balloon.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <Button variant="soft" className="w-full" onClick={addBalloon}>
          <Plus className="w-4 h-4" />
          Agregar globos
        </Button>
      </CardContent>
    </Card>
  );
}
