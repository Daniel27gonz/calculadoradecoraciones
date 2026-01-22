import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Extra } from '@/types/quote';

interface ExtrasSectionProps {
  extras: Extra[];
  onChange: (extras: Extra[]) => void;
  currencySymbol?: string;
}

export function ExtrasSection({ extras, onChange, currencySymbol = '$' }: ExtrasSectionProps) {
  const addExtra = () => {
    onChange([
      ...extras,
      { id: crypto.randomUUID(), name: '', pricePerUnit: 0, quantity: 0 },
    ]);
  };

  const updateExtra = (id: string, updates: Partial<Extra>) => {
    onChange(extras.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExtra = (id: string) => {
    onChange(extras.filter(e => e.id !== id));
  };

  const total = extras.reduce((sum, e) => sum + (e.pricePerUnit || 0) * (e.quantity || 0), 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">🥇</span>
            <span>Adicionales del cliente</span>
            <span className="text-xl sm:text-2xl">⭐</span>
          </CardTitle>
          <div className="px-3 py-1.5 rounded-full bg-beige border border-border">
            <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Agrega aquí todo lo que el cliente pidió aparte de la decoración base (viniles, letras, letreros, personalizaciones).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {extras.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay extras agregados
          </div>
        )}

        {extras.map((extra) => {
          const itemTotal = (extra.pricePerUnit || 0) * (extra.quantity || 0);
          
          return (
            <div
              key={extra.id}
              className="p-4 rounded-xl bg-beige/70 border border-border/50 animate-fade-in space-y-3"
            >
              {/* Name field */}
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Nombre del extra
                  </label>
                  <Input
                    value={extra.name}
                    onChange={(e) => updateExtra(extra.id, { name: e.target.value })}
                    placeholder="Ej: Decoración especial"
                    className="h-11 text-base bg-background/50"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExtra(extra.id)}
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
                  value={extra.pricePerUnit || ''}
                  onChange={(e) => updateExtra(extra.id, { pricePerUnit: Number(e.target.value) || 0 })}
                />
                <NumericField
                  label="Cantidad"
                  min={0}
                  step={1}
                  value={extra.quantity || ''}
                  onChange={(e) => updateExtra(extra.id, { quantity: Number(e.target.value) || 0 })}
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

        <Button variant="secondary" className="w-full h-12 text-base font-medium" onClick={addExtra}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar extra
        </Button>
      </CardContent>
    </Card>
  );
}
