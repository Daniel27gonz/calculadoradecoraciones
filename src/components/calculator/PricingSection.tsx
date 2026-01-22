import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NumericField } from '@/components/ui/numeric-field';
import { CostSummary } from '@/types/quote';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface PricingSectionProps {
  summary: CostSummary;
  marginPercentage: number;
  toolWearPercentage: number;
  wastagePercentage: number;
  onMarginChange: (margin: number) => void;
  currencySymbol?: string;
}
const marginOptions = [{
  value: 20,
  label: '20%',
  description: 'Económico'
}, {
  value: 30,
  label: '30%',
  description: 'Estándar'
}, {
  value: 40,
  label: '40%',
  description: 'Premium'
}, {
  value: 50,
  label: '50%',
  description: 'Lujo'
}];

export function PricingSection({
  summary,
  marginPercentage,
  toolWearPercentage,
  wastagePercentage,
  onMarginChange,
  currencySymbol = '$'
}: PricingSectionProps) {
  const { user, profile } = useAuth();
  const [indirectExpensesTotal, setIndirectExpensesTotal] = useState(0);

  // Load indirect expenses from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`indirect_expenses_${user.id}`);
      if (stored) {
        const expenses = JSON.parse(stored);
        const total = expenses.reduce((sum: number, e: { monthlyAmount: number }) => sum + (e.monthlyAmount || 0), 0);
        setIndirectExpensesTotal(total);
      }
    }
  }, [user]);

  // Calculate indirect expenses per event
  const eventsPerMonth = profile?.events_per_month || 4;
  const indirectExpensesPerEvent = eventsPerMonth > 0 ? indirectExpensesTotal / eventsPerMonth : 0;

  // Calculate adjusted totals including indirect expenses
  const adjustedTotalCost = summary.totalCost + indirectExpensesPerEvent;
  const adjustedFinalPrice = adjustedTotalCost * (1 + marginPercentage / 100);
  const adjustedNetProfit = adjustedFinalPrice - adjustedTotalCost;
  const adjustedProfitPercentage = adjustedFinalPrice > 0 ? (adjustedNetProfit / adjustedFinalPrice) * 100 : 0;
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

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Cost line item component
  const CostLine = ({
    icon,
    label,
    sublabel,
    amount,
    highlighted = false
  }: {
    icon: string;
    label: string;
    sublabel?: React.ReactNode;
    amount: number;
    highlighted?: boolean;
  }) => <div className={cn("flex items-center justify-between gap-4 px-4 py-3 transition-colors", highlighted ? "bg-muted/40" : "hover:bg-muted/30")}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-lg sm:text-xl flex-shrink-0">{icon}</span>
        <div className="min-w-0">
          <span className="text-sm sm:text-base font-medium block truncate">{label}</span>
          {sublabel}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="font-bold text-sm sm:text-base tabular-nums whitespace-nowrap">
          {formatCurrency(amount)}
        </span>
      </div>
    </div>;
  return <div className="space-y-4">
      {/* Cost Summary - Hoja de Cotización */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">📋</span>
            <span>Hoja de Cotización</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Cost breakdown */}
          <div className="divide-y divide-border/50">
            <CostLine icon="🎀" label="Total materiales" amount={summary.totalMaterials} />
            <CostLine icon="📉" label={`Merma (${wastagePercentage}%)`} amount={summary.wastage} />
            <CostLine icon="👩‍🎨" label="Total mano de obra" amount={summary.totalLabor} />
            <CostLine icon="🚗" label="Total transporte" amount={summary.totalTransport} />
            <CostLine icon="🔧" label={`Desgaste herramientas (${toolWearPercentage}%)`} amount={summary.toolWear} highlighted />
            <CostLine icon="✨" label="Total extras" amount={summary.totalExtras} />
            <CostLine 
              icon="📊" 
              label="Gastos indirectos" 
              sublabel={
                <span className="text-xs text-muted-foreground">
                  ({formatCurrency(indirectExpensesTotal)}/mes ÷ {eventsPerMonth} eventos)
                </span>
              }
              amount={indirectExpensesPerEvent} 
              highlighted 
            />
          </div>

          {/* Total General */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-primary via-primary to-primary/90">
            <div className="flex items-center justify-between gap-4">
              <span className="text-primary-foreground font-bold text-base sm:text-lg">
                Total General
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground tabular-nums">
                {formatCurrency(adjustedTotalCost)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Margin Selection */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">💰</span>
            <span>Margen de Ganancia</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Margin buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {marginOptions.map(({
            value,
            label,
            description
          }) => <Button key={value} variant={marginPercentage === value ? 'default' : 'outline'} className={cn("flex flex-col h-auto py-3 px-2", marginPercentage === value && "shadow-card ring-2 ring-primary/20")} onClick={() => onMarginChange(value)}>
                <span className="font-bold text-base sm:text-lg">{label}</span>
                <span className="text-[10px] sm:text-xs opacity-70 mt-0.5">{description}</span>
              </Button>)}
          </div>

          {/* Custom margin input */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Personalizado:</span>
            <NumericField min={0} max={200} value={marginPercentage ?? ''} onChange={e => onMarginChange(e.target.value === '' ? 0 : Number(e.target.value))} suffix="%" className="w-24 h-10" />
          </div>

          <div className="h-px bg-border" />

          {/* Final price */}
          <div className="p-4 sm:p-5 rounded-xl gradient-primary">
            <div className="flex items-center justify-between gap-4">
              <span className="text-primary-foreground font-bold text-base sm:text-lg">
                Precio Final
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground tabular-nums">
                {formatCurrency(adjustedFinalPrice)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis */}
      <Card className={cn("shadow-card border-2", getProfitBg(adjustedProfitPercentage))}>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">📈</span>
              <span>Tu Ganancia</span>
            </span>
            <span className={cn("text-sm font-medium px-3 py-1 rounded-full bg-background/50", getProfitColor(adjustedProfitPercentage))}>
              {getProfitLabel(adjustedProfitPercentage)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Ganancia Neta</p>
              <p className={cn("text-lg sm:text-2xl font-bold tabular-nums", getProfitColor(adjustedProfitPercentage))}>
                {currencySymbol}{adjustedNetProfit.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Porcentaje</p>
              <p className={cn("text-lg sm:text-2xl font-bold tabular-nums", getProfitColor(adjustedProfitPercentage))}>
                {adjustedProfitPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-card border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Por Hora</p>
              <p className={cn("text-lg sm:text-2xl font-bold tabular-nums", getProfitColor(adjustedProfitPercentage))}>
                {currencySymbol}{(summary.totalTime > 0 ? adjustedNetProfit / summary.totalTime : 0).toFixed(0)}
              </p>
            </div>
          </div>

          {/* Profit indicator bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>Bajo</span>
              <span>Medio</span>
              <span>Alto</span>
            </div>
            <div className="h-3 rounded-full bg-gradient-to-r from-profit-low via-profit-medium to-profit-high relative overflow-hidden">
              <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-card border-2 border-foreground shadow-lg transition-all duration-300" style={{
              left: `calc(${Math.min(Math.max(adjustedProfitPercentage, 0), 60)}% - 10px)`
            }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}