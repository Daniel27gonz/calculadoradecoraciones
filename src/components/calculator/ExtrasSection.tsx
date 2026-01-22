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

const suggestedExtras: { name: string; icon: string }[] = [];

export function ExtrasSection({ extras, onChange, currencySymbol = '$' }: ExtrasSectionProps) {
  const addExtra = (name?: string) => {
    onChange([
      ...extras,
      { id: crypto.randomUUID(), name: name || '', cost: 0 },
    ]);
  };

  const updateExtra = (id: string, updates: Partial<Extra>) => {
    onChange(extras.map(e => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeExtra = (id: string) => {
    onChange(extras.filter(e => e.id !== id));
  };

  const total = extras.reduce((sum, e) => sum + e.cost, 0);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const unusedSuggestions = suggestedExtras.filter(
    s => !extras.some(e => e.name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">✨</span>
            <span>Extras</span>
          </CardTitle>
          <div className="px-3 py-1.5 rounded-full bg-beige border border-border">
            <span className="text-sm sm:text-base font-bold text-foreground tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick add buttons */}
        {unusedSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map(({ name, icon }) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => addExtra(name)}
                className="text-sm h-9 px-3"
              >
                <span className="mr-1.5">{icon}</span>
                {name}
              </Button>
            ))}
          </div>
        )}

        {extras.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay extras agregados
          </div>
        )}

        {extras.map((extra) => (
          <div
            key={extra.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-beige/70 border border-border/50 animate-fade-in"
          >
            {/* Description */}
            <div className="flex-1 min-w-0">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block sm:hidden">
                Descripción
              </label>
              <Input
                value={extra.name}
                onChange={(e) => updateExtra(extra.id, { name: e.target.value })}
                placeholder="Descripción del extra"
                className="h-11 text-base bg-background/50"
              />
            </div>
            
            {/* Cost */}
            <div className="flex items-end gap-3">
              <div className="flex-1 sm:w-32">
                <NumericField
                  label="Costo"
                  prefix={currencySymbol}
                  min={0}
                  step={0.01}
                  value={extra.cost}
                  onChange={(e) => updateExtra(extra.id, { cost: Number(e.target.value) })}
                  containerClassName="sm:hidden"
                />
                <NumericField
                  prefix={currencySymbol}
                  min={0}
                  step={0.01}
                  value={extra.cost}
                  onChange={(e) => updateExtra(extra.id, { cost: Number(e.target.value) })}
                  containerClassName="hidden sm:block"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeExtra(extra.id)}
                className="h-11 w-11 text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="secondary" className="w-full h-12 text-base font-medium" onClick={() => addExtra()}>
          <Plus className="w-5 h-5 mr-2" />
          Agregar extra
        </Button>
      </CardContent>
    </Card>
  );
}
