import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TransportItem } from '@/types/quote';

interface TransportSectionProps {
  transportItems: TransportItem[];
  onChange: (items: TransportItem[]) => void;
}

export function TransportSection({ transportItems, onChange }: TransportSectionProps) {
  const addItem = () => {
    onChange([
      ...transportItems,
      { id: crypto.randomUUID(), concept: '', amount: undefined as unknown as number },
    ]);
  };

  const updateItem = (id: string, updates: Partial<TransportItem>) => {
    onChange(transportItems.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeItem = (id: string) => {
    onChange(transportItems.filter(t => t.id !== id));
  };

  const total = transportItems.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              Transporte / Gasolina
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega gastos de gasolina, casetas, estacionamiento, etc.
            </p>
          </div>
          <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transportItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-secondary/50 space-y-3 animate-fade-in"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Concepto</label>
                  <Input
                    value={item.concept}
                    onChange={(e) => updateItem(item.id, { concept: e.target.value })}
                    placeholder="Ej: Gasolina ida y vuelta"
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Importe gastado</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount ?? ''}
                    onChange={(e) => updateItem(item.id, { amount: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) })}
                    placeholder=""
                    className="h-10"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={addItem}>
          <Plus className="w-4 h-4" />
          Agregar gasto de transporte
        </Button>
      </CardContent>
    </Card>
  );
}
