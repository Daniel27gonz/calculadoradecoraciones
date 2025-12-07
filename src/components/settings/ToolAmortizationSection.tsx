import { Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToolAmortization } from '@/types/quote';

interface ToolAmortizationSectionProps {
  tools: ToolAmortization[];
  onChange: (tools: ToolAmortization[]) => void;
}

const defaultTools: Omit<ToolAmortization, 'cost'>[] = [
  { id: '1', name: 'Cilindro mediano', recommendedUses: 60 },
  { id: '2', name: 'Cilindro grande', recommendedUses: 7 },
  { id: '3', name: 'Base metálica tipo "mesita"', recommendedUses: 40 },
  { id: '4', name: 'Arco de PVC completo', recommendedUses: 6 },
  { id: '5', name: 'Tubos de PVC extras', recommendedUses: 10 },
  { id: '6', name: 'Backdrop redondo metálico', recommendedUses: 80 },
  { id: '7', name: 'Soporte telescópico para telas', recommendedUses: 50 },
  { id: '8', name: 'Soporte metálico para burbuja', recommendedUses: 30 },
];

export function ToolAmortizationSection({ tools, onChange }: ToolAmortizationSectionProps) {
  // Initialize tools if empty
  const currentTools = tools.length > 0 ? tools : defaultTools.map(t => ({ ...t, cost: 0 }));

  const updateToolCost = (id: string, cost: number) => {
    const updatedTools = currentTools.map(t => 
      t.id === id ? { ...t, cost } : t
    );
    onChange(updatedTools);
  };

  const calculateCostPerEvent = (cost: number, uses: number) => {
    if (!cost || uses === 0) return 0;
    return cost / uses;
  };

  const totalAmortizationPerEvent = currentTools.reduce(
    (sum, tool) => sum + calculateCostPerEvent(tool.cost || 0, tool.recommendedUses),
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Amortización de herramientas</CardTitle>
            <CardDescription>
              Ingresa el costo de tus herramientas para calcular el costo por evento
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total por evento</p>
            <p className="text-lg font-bold text-primary">${totalAmortizationPerEvent.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
          <div className="col-span-4">Herramienta</div>
          <div className="col-span-3 text-center">Costo</div>
          <div className="col-span-2 text-center">Usos</div>
          <div className="col-span-3 text-right">Por evento</div>
        </div>

        {/* Tool rows */}
        {currentTools.map((tool) => {
          const costPerEvent = calculateCostPerEvent(tool.cost || 0, tool.recommendedUses);
          return (
            <div
              key={tool.id}
              className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-secondary/30"
            >
              <div className="col-span-4">
                <span className="text-sm font-medium">{tool.name}</span>
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tool.cost ?? ''}
                  onChange={(e) => updateToolCost(tool.id, e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder=""
                  className="h-8 text-center text-sm"
                />
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                  {tool.recommendedUses}
                </span>
              </div>
              <div className="col-span-3 text-right">
                <span className="text-sm font-semibold text-primary">
                  ${costPerEvent.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground mt-4">
          * Los usos recomendados son valores predefinidos basados en el uso promedio de cada herramienta.
        </p>
      </CardContent>
    </Card>
  );
}
