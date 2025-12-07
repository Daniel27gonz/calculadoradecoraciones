import { Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface TransportSectionProps {
  transportCost: number;
  onChange: (cost: number) => void;
}

export function TransportSection({ transportCost, onChange }: TransportSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            Gastos de Transporte
          </CardTitle>
          <span className="text-lg font-semibold text-primary">${(transportCost || 0).toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Costo de transporte</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={transportCost ?? ''}
              onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder="Ingresa el costo de transporte"
              className="h-10"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Incluye gasolina, casetas, estacionamiento, etc.
        </p>
      </CardContent>
    </Card>
  );
}
