import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NumericField } from '@/components/ui/numeric-field';
import { cn } from '@/lib/utils';

interface WastageSectionProps {
  totalMaterials: number;
  wastagePercentage: number;
  onPercentageChange: (percentage: number) => void;
  currencySymbol?: string;
}

const wastageOptions = [
  { value: 1, label: '1%' },
  { value: 3, label: '3%' },
  { value: 5, label: '5%' },
  { value: 7, label: '7%' },
  { value: 10, label: '10%' },
];

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
          <span>Merma</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Porcentaje de pérdida estimada sobre el total de materiales ({formatCurrency(totalMaterials)})
        </p>

        {/* Percentage buttons */}
        <div className="grid grid-cols-5 gap-2">
          {wastageOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={wastagePercentage === value ? 'default' : 'outline'}
              className={cn(
                "h-auto py-3",
                wastagePercentage === value && "shadow-card ring-2 ring-primary/20"
              )}
              onClick={() => onPercentageChange(value)}
            >
              <span className="font-bold text-sm sm:text-base">{label}</span>
            </Button>
          ))}
        </div>

        {/* Custom percentage input */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Personalizado:</span>
          <NumericField
            min={1}
            max={10}
            value={wastagePercentage ?? ''}
            onChange={(e) => onPercentageChange(e.target.value === '' ? 1 : Number(e.target.value))}
            suffix="%"
            className="w-24 h-10"
          />
        </div>

        {/* Calculated amount */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
          <span className="text-sm font-medium">
            Merma ({wastagePercentage}%)
          </span>
          <span className="font-bold text-lg tabular-nums">
            {formatCurrency(wastageAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
