import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Extra } from '@/types/quote';

interface ExtrasSectionProps {
  extras: Extra[];
  onChange: (extras: Extra[]) => void;
}

const suggestedExtras = [
  { name: 'Transporte', icon: '🚗' },
  { name: 'Alquiler', icon: '🏠' },
  { name: 'Imprevistos', icon: '⚡' },
  { name: 'Impuestos', icon: '📋' },
];

export function ExtrasSection({ extras, onChange }: ExtrasSectionProps) {
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

  const unusedSuggestions = suggestedExtras.filter(
    s => !extras.some(e => e.name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Extras
          </CardTitle>
          <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
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
                className="text-xs"
              >
                {icon} {name}
              </Button>
            ))}
          </div>
        )}

        {extras.map((extra) => (
          <div
            key={extra.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-beige animate-fade-in"
          >
            <Input
              value={extra.name}
              onChange={(e) => updateExtra(extra.id, { name: e.target.value })}
              placeholder="Descripción"
              className="flex-1 border-none bg-transparent focus-visible:ring-0"
            />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={extra.cost}
                onChange={(e) => updateExtra(extra.id, { cost: Number(e.target.value) })}
                className="w-24 h-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExtra(extra.id)}
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button variant="secondary" className="w-full" onClick={() => addExtra()}>
          <Plus className="w-4 h-4" />
          Agregar extra
        </Button>
      </CardContent>
    </Card>
  );
}
