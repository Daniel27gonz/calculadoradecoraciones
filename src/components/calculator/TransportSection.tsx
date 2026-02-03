import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { TransportItem } from '@/types/quote';

interface TransportSectionProps {
  transportItems: TransportItem[];
  onChange: (items: TransportItem[]) => void;
  currencySymbol?: string;
}

export function TransportSection({ transportItems, onChange, currencySymbol = '$' }: TransportSectionProps) {
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

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">🚗</span>
              <span>Traslado</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 ml-8 sm:ml-9">
              Gasolina, casetas, estacionamiento, etc.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-secondary border border-border">
            <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transportItems.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay gastos de transporte agregados
          </div>
        )}

        {transportItems.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-4 animate-fade-in"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-4">
                {/* Concept */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Concepto
                  </label>
                  <Input
                    value={item.concept}
                    onChange={(e) => updateItem(item.id, { concept: e.target.value })}
                    placeholder="Ej: Gasolina ida y vuelta"
                    className="h-11 text-base"
                  />
                </div>
                
                {/* Amount */}
                <NumericField
                  label="Importe gastado"
                  prefix={currencySymbol}
                  min={0}
                  step={0.01}
                  value={item.amount ?? ''}
                  onChange={(e) => updateItem(item.id, { 
                    amount: e.target.value === '' ? undefined as unknown as number : Number(e.target.value) 
                  })}
                  placeholder="0.00"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0 mt-6"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full h-12 text-base font-medium" onClick={addItem}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar gasto de transporte
        </Button>
      </CardContent>
    </Card>
  );
}
