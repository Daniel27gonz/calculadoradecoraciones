import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Balloon } from '@/types/quote';
interface BalloonSectionProps {
  balloons: Balloon[];
  onChange: (balloons: Balloon[]) => void;
  currencySymbol?: string;
}
export function BalloonSection({
  balloons,
  onChange,
  currencySymbol = '$'
}: BalloonSectionProps) {
  const addBalloon = () => {
    onChange([...balloons, {
      id: crypto.randomUUID(),
      description: '',
      pricePerUnit: undefined as unknown as number,
      quantity: undefined as unknown as number
    }]);
  };
  const updateBalloon = (id: string, updates: Partial<Balloon>) => {
    onChange(balloons.map(b => b.id === id ? {
      ...b,
      ...updates
    } : b));
  };
  const removeBalloon = (id: string) => {
    onChange(balloons.filter(b => b.id !== id));
  };
  const total = balloons.reduce((sum, b) => sum + (b.pricePerUnit || 0) * (b.quantity || 0), 0);
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">🎈</span>
              <span>Globos</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 ml-8 sm:ml-9">
              Globos de látex, foil, burbuja, etc.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-rose-light/50 border border-rose-light">
            <span className="text-sm sm:text-base font-bold text-rose-dark tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {balloons.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay globos agregados
          </div>
        )}

        {balloons.map((balloon) => (
          <div
            key={balloon.id}
            className="p-4 rounded-xl bg-rose-light/20 border border-rose-light/30 space-y-4 animate-fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Descripción del globo
                </label>
                <Input
                  value={balloon.description}
                  onChange={(e) => updateBalloon(balloon.id, { description: e.target.value })}
                  placeholder="Ej: Globo R12 Rojo Mate"
                  className="h-11 text-base"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeBalloon(balloon.id)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumericField
                label="Precio/unidad"
                prefix={currencySymbol}
                min={0}
                step={0.01}
                value={balloon.pricePerUnit ?? ''}
                onChange={(e) => updateBalloon(balloon.id, { 
                  pricePerUnit: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0.00"
              />
              <NumericField
                label="Cantidad"
                min={0}
                value={balloon.quantity ?? ''}
                onChange={(e) => updateBalloon(balloon.id, { 
                  quantity: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                })}
                placeholder="0"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-rose-light/20">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block mb-0.5">Subtotal</span>
                <span className="text-base sm:text-lg font-bold text-rose-dark tabular-nums">
                  {currencySymbol}{formatCurrency((balloon.pricePerUnit || 0) * (balloon.quantity || 0))}
                </span>
              </div>
            </div>
          </div>
        ))}

        <Button 
          variant="outline" 
          className="w-full h-12 text-base font-medium border-rose-light text-rose-dark hover:bg-rose-light/10" 
          onClick={addBalloon}
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar globo
        </Button>
      </CardContent>
    </Card>
  );
}