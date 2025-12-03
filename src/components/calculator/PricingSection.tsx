import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CostSummary } from '@/types/quote';
import { cn } from '@/lib/utils';

interface PricingSectionProps {
  summary: CostSummary;
  marginPercentage: number;
  onMarginChange: (margin: number) => void;
}

const marginOptions = [
  { value: 20, label: '20%', description: 'Económico' },
  { value: 30, label: '30%', description: 'Estándar' },
  { value: 40, label: '40%', description: 'Premium' },
  { value: 50, label: '50%', description: 'Lujo' },
];

export function PricingSection({ summary, marginPercentage, onMarginChange }: PricingSectionProps) {
  const getProfitColor = (percentage: number) => {
    if (percentage >= 40) return 'text-profit-high';
    if (percentage >= 20) return 'text-profit-medium';
    return 'text-profit-low';
  };

  const getProfitBg = (percentage: number) => {
    if (percentage >= 40) return 'bg-profit-high/10 border-profit-high/30';
    if (percentage >= 20) return 'bg-profit-medium/10 border-profit-medium/30';
    return 'bg-profit-low/10 border-profit-low/30';
  };

  const getProfitLabel = (percentage: number) => {
    if (percentage >= 40) return '¡Excelente! 🎉';
    if (percentage >= 20) return 'Aceptable 👍';
    return 'Revisar precios ⚠️';
  };

  return (
    <div className="space-y-4">
      {/* Cost Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Resumen de Costos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">🎈 Total globos</span>
              <span className="font-medium">${summary.totalBalloons.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">🎀 Total materiales</span>
              <span className="font-medium">${summary.totalMaterials.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">👩‍🎨 Total mano de obra</span>
              <span className="font-medium">${summary.totalLabor.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">⏱️ Total tiempo</span>
              <span className="font-medium">${summary.totalTime.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">✨ Total extras</span>
              <span className="font-medium">${summary.totalExtras.toFixed(2)}</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <span className="font-semibold">Costo Total</span>
            <span className="text-xl font-bold text-primary">${summary.totalCost.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Margin Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Margen de Ganancia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {marginOptions.map(({ value, label, description }) => (
              <Button
                key={value}
                variant={marginPercentage === value ? 'default' : 'outline'}
                className={cn(
                  "flex flex-col h-auto py-3",
                  marginPercentage === value && "shadow-card"
                )}
                onClick={() => onMarginChange(value)}
              >
                <span className="font-bold">{label}</span>
                <span className="text-[10px] opacity-70">{description}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Personalizado:</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="200"
                value={marginPercentage}
                onChange={(e) => onMarginChange(Number(e.target.value))}
                className="w-20 h-9 text-center"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="p-4 rounded-xl gradient-primary">
            <div className="flex justify-between items-center">
              <span className="text-primary-foreground font-medium">Precio Final</span>
              <span className="text-3xl font-bold text-primary-foreground">
                ${summary.finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis */}
      <Card className={cn("border-2", getProfitBg(summary.profitPercentage))}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Tu Ganancia
            </span>
            <span className={cn("text-sm font-medium", getProfitColor(summary.profitPercentage))}>
              {getProfitLabel(summary.profitPercentage)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">Ganancia Neta</p>
              <p className={cn("text-2xl font-bold", getProfitColor(summary.profitPercentage))}>
                ${summary.netProfit.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">Porcentaje</p>
              <p className={cn("text-2xl font-bold", getProfitColor(summary.profitPercentage))}>
                {summary.profitPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-card">
              <p className="text-xs text-muted-foreground mb-1">Por Hora</p>
              <p className={cn("text-2xl font-bold", getProfitColor(summary.profitPercentage))}>
                ${summary.profitPerHour.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Profit indicator bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bajo</span>
              <span>Medio</span>
              <span>Alto</span>
            </div>
            <div className="h-3 rounded-full bg-gradient-to-r from-profit-low via-profit-medium to-profit-high relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-card border-2 border-foreground shadow-md transition-all duration-300"
                style={{ left: `calc(${Math.min(summary.profitPercentage, 60)}% - 8px)` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
