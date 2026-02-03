import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { FurnitureItem } from '@/types/quote';

interface FurnitureSectionProps {
  furnitureItems: FurnitureItem[];
  onChange: (furnitureItems: FurnitureItem[]) => void;
  currencySymbol?: string;
}

export function FurnitureSection({ furnitureItems, onChange, currencySymbol = '$' }: FurnitureSectionProps) {
  const addItem = () => {
    onChange([
      ...furnitureItems,
      { id: crypto.randomUUID(), name: '', pricePerUnit: 0, quantity: 0 },
    ]);
  };

  const updateItem = (id: string, updates: Partial<FurnitureItem>) => {
    onChange(furnitureItems.map(item => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeItem = (id: string) => {
    onChange(furnitureItems.filter(item => item.id !== id));
  };

  const total = furnitureItems.reduce((sum, item) => sum + (item.pricePerUnit || 0) * (item.quantity || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">🪑</span>
              <span>Mobiliario y soporte</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 ml-8 sm:ml-9">
              Mesas, sillas, estructuras, bases, etc.
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
        {furnitureItems.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay mobiliario agregado
          </div>
        )}

        {furnitureItems.map((item) => {
          const itemTotal = (item.pricePerUnit || 0) * (item.quantity || 0);
          
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-secondary/50 border border-border/50 animate-fade-in space-y-3"
            >
              {/* Name field */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Descripción
                  </label>
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    placeholder="Ej: Mesa de postres, Estructura metálica"
                    className="h-11 text-base bg-background/50"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0 mt-6"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Price, Quantity, and Total row */}
              <div className="grid grid-cols-3 gap-3">
                <NumericField
                  label="Precio/unidad"
                  prefix={currencySymbol}
                  min={0}
                  step={0.01}
                  value={item.pricePerUnit || ''}
                  onChange={(e) => updateItem(item.id, { pricePerUnit: Number(e.target.value) || 0 })}
                />
                <NumericField
                  label="Cantidad"
                  min={0}
                  step={1}
                  value={item.quantity || ''}
                  onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) || 0 })}
                />
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Total
                  </label>
                  <div className="h-11 px-3 flex items-center rounded-lg bg-primary/10 border border-primary/20">
                    <span className="font-bold text-sm tabular-nums text-primary">
                      {currencySymbol}{formatCurrency(itemTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <Button variant="secondary" className="w-full h-12 text-base font-medium" onClick={addItem}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar mobiliario
        </Button>
      </CardContent>
    </Card>
  );
}
