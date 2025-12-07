import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Balloon } from '@/types/quote';

interface BalloonSectionProps {
  balloons: Balloon[];
  onChange: (balloons: Balloon[]) => void;
}

export function BalloonSection({ balloons, onChange }: BalloonSectionProps) {
  const addBalloon = () => {
    onChange([
      ...balloons,
      { id: crypto.randomUUID(), description: '', pricePerUnit: undefined as unknown as number, quantity: undefined as unknown as number },
    ]);
  };

  const updateBalloon = (id: string, updates: Partial<Balloon>) => {
    onChange(balloons.map(b => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBalloon = (id: string) => {
    onChange(balloons.filter(b => b.id !== id));
  };

  const total = balloons.reduce((sum, b) => sum + (b.pricePerUnit || 0) * (b.quantity || 0), 0);

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
              <Input
                value={balloon.description}
                onChange={(e) => updateBalloon(balloon.id, { description: e.target.value })}
                placeholder="Descripción del globo"
                className="font-medium border-none bg-transparent p-0 h-auto text-base focus-visible:ring-0 flex-1"
              />
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
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Precio/unidad</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balloon.pricePerUnit ?? ''}
                  onChange={(e) => updateBalloon(balloon.id, { pricePerUnit: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })}
                  placeholder=""
                  className="h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input
                  type="number"
                  min="0"
                  value={balloon.quantity ?? ''}
                  onChange={(e) => updateBalloon(balloon.id, { quantity: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })}
                  placeholder=""
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <span className="text-sm font-semibold text-primary">
                Subtotal: ${((balloon.pricePerUnit || 0) * (balloon.quantity || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <Button variant="soft" className="w-full" onClick={addBalloon}>
          <Plus className="w-4 h-4" />
          Agregar globo
        </Button>
      </CardContent>
    </Card>
  );
}
