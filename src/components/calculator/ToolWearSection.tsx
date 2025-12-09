import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolWearSectionProps {
  totalBalloons: number;
  totalMaterials: number;
  totalLabor: number;
  toolWearPercentage: number;
  onPercentageChange: (percentage: number) => void;
  currencySymbol?: string;
}

const percentageOptions = [5, 6, 7, 8, 9, 10];

export function ToolWearSection({
  totalBalloons,
  totalMaterials,
  totalLabor,
  toolWearPercentage,
  onPercentageChange,
  currencySymbol = '$',
}: ToolWearSectionProps) {
  const subtotal = totalBalloons + totalMaterials + totalLabor;
  const toolWearAmount = subtotal * (toolWearPercentage / 100);

  const handleSliderChange = (values: number[]) => {
    onPercentageChange(values[0]);
  };

  const handleInputChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 5 && num <= 10) {
      onPercentageChange(num);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔧</span>
            Herramientas (Desgaste)
          </CardTitle>
          <span className="text-lg font-semibold text-primary">
            {currencySymbol}{toolWearAmount.toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info text */}
        <p className="text-sm text-muted-foreground">
          Porcentaje de desgaste de herramientas (aplicado a Materiales + Globos + Mano de obra)
        </p>

        {/* Quick percentage buttons */}
        <div className="grid grid-cols-6 gap-2">
          {percentageOptions.map((value) => (
            <Button
              key={value}
              variant={toolWearPercentage === value ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "font-semibold",
                toolWearPercentage === value && "shadow-card"
              )}
              onClick={() => onPercentageChange(value)}
            >
              {value}%
            </Button>
          ))}
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>5%</span>
            <span>10%</span>
          </div>
          <Slider
            value={[toolWearPercentage]}
            onValueChange={handleSliderChange}
            min={5}
            max={10}
            step={1}
            className="py-2"
          />
        </div>

        {/* Custom input */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Personalizado:</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="5"
              max="10"
              step="1"
              value={toolWearPercentage}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-20 h-9 text-center"
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>

        {/* Calculation breakdown */}
        <div className="p-4 rounded-xl bg-beige/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal base</span>
            <span className="font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Porcentaje aplicado</span>
            <span className="font-medium">{toolWearPercentage}%</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between">
            <span className="font-semibold">Desgaste calculado</span>
            <span className="font-bold text-primary">{currencySymbol}{toolWearAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
