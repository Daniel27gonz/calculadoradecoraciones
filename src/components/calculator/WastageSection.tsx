import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { NumericField } from '@/components/ui/numeric-field';

interface WastageSectionProps {
  totalMaterials: number;
  wastagePercentage: number;
  onPercentageChange: (percentage: number) => void;
  currencySymbol?: string;
}

export function WastageSection({
  totalMaterials,
  wastagePercentage,
  onPercentageChange,
  currencySymbol = '$'
}: WastageSectionProps) {
  const wastageAmount = totalMaterials * (wastagePercentage / 100);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <span className="text-xl sm:text-2xl">📉</span>
          <span>Desperdicio</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Porcentaje adicional sobre el costo de materiales para cubrir desperdicios y pérdidas.
        </p>
        
        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Porcentaje de desperdicio</span>
            <div className="flex items-center gap-2">
              <NumericField
                min={1}
                max={10}
                value={wastagePercentage}
                onChange={(e) => onPercentageChange(Number(e.target.value) || 1)}
                suffix="%"
                className="w-20 h-9 text-center"
              />
            </div>
          </div>
          <Slider
            value={[wastagePercentage]}
            onValueChange={(values) => onPercentageChange(values[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1%</span>
            <span>5%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Calculation display */}
        <div className="p-4 rounded-lg bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total materiales:</span>
            <span className="font-medium">{formatCurrency(totalMaterials)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desperdicio ({wastagePercentage}%):</span>
            <span className="font-bold text-primary">{formatCurrency(wastageAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
