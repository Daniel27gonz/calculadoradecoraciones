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

  // Load indirect expenses total for display purposes (only current month)
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`indirect_expenses_${user.id}`);
      if (stored) {
        const expenses = JSON.parse(stored) as { monthlyAmount: number; paymentDate?: string }[];
        // Find the latest month with registered expenses
        const withDates = expenses.filter(e => e.paymentDate);
        let latestY = 0, latestM = 0;
        withDates.forEach(e => {
          const [y, m] = e.paymentDate!.split('-');
          const yr = parseInt(y), mo = parseInt(m);
          if (yr > latestY || (yr === latestY && mo > latestM)) {
            latestY = yr;
            latestM = mo;
          }
        });
        const total = withDates
          .filter(e => {
            const [y, m] = e.paymentDate!.split('-');
            return parseInt(y) === latestY && parseInt(m) === latestM;
          })
          .reduce((sum, e) => sum + (e.monthlyAmount || 0), 0);
        setIndirectExpensesTotal(total);
      }
    }
  }, [user]);

  const eventsPerMonth = profile?.events_per_month || 4;

  // Use values from summary (already includes indirect expenses)
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
  }) => <div className={cn("flex items-start justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-3 transition-colors", highlighted ? "bg-muted/40" : "hover:bg-muted/30")}>
      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
        <span className="text-base sm:text-xl flex-shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0">
          <span className="text-xs sm:text-base font-medium block break-words leading-tight">{label}</span>
          {sublabel}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="font-bold text-xs sm:text-base tabular-nums whitespace-nowrap">
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
            <CostLine icon="🎀" label="Materiales de Consumo (No Reutilizables)" amount={summary.totalMaterials} />
            <CostLine icon="🧮" label="Material Reutilizable (Renta de Equipo Decorativo)" amount={summary.totalReusableMaterials} />
            <CostLine icon="📉" label={`Merma (${wastagePercentage}%)`} amount={summary.wastage} highlighted />
            <CostLine icon="👩‍🎨" label="Total mano de obra" amount={summary.totalLabor} />
            <CostLine icon="🚗" label="Total transporte" amount={summary.totalTransport} />
            
            <CostLine icon="✨" label="Total extras" amount={summary.totalExtras} />
            <CostLine 
              icon="📊" 
              label="Gastos indirectos" 
              sublabel={
                <span className="text-xs text-muted-foreground">
                  ({formatCurrency(indirectExpensesTotal)}/mes ÷ {eventsPerMonth} eventos)
                </span>
              }
              amount={summary.indirectExpenses} 
              highlighted 
            />
          </div>

          {/* Total General */}
          <div className="p-3 sm:p-5 bg-gradient-to-r from-primary via-primary to-primary/90">
            <div className="flex items-center justify-between gap-2">
              <span className="text-primary-foreground font-bold text-sm sm:text-lg shrink-0">
                Total General
              </span>
              <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground tabular-nums truncate">
                {formatCurrency(summary.totalCost)}
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
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
            {marginOptions.map(({
            value,
            label,
            description
          }) => <Button key={value} variant={marginPercentage === value ? 'default' : 'outline'} className={cn("flex flex-col h-auto py-2 sm:py-3 px-1 sm:px-2", marginPercentage === value && "shadow-card ring-2 ring-primary/20")} onClick={() => onMarginChange(value)}>
                <span className="font-bold text-sm sm:text-lg">{label}</span>
                <span className="text-[9px] sm:text-xs opacity-70 mt-0.5">{description}</span>
              </Button>)}
          </div>

          {/* Custom margin input */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Personalizado:</span>
            <NumericField min={0} max={200} value={marginPercentage ?? ''} onChange={e => onMarginChange(e.target.value === '' ? 0 : Number(e.target.value))} suffix="%" className="w-24 h-10" />
          </div>

          <div className="h-px bg-border" />

          {/* Final price */}
          <div className="p-3 sm:p-5 rounded-xl gradient-primary">
            <div className="flex items-center justify-between gap-2">
              <span className="text-primary-foreground font-bold text-sm sm:text-lg shrink-0">
                Precio Final
              </span>
              <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground tabular-nums truncate">
                {formatCurrency(summary.finalPrice)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profit Analysis */}
      <Card className={cn("shadow-card border-2", getProfitBg(summary.profitPercentage))}>
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="text-xl sm:text-2xl">📈</span>
              <span>Tu Ganancia</span>
            </span>
            <span className={cn("text-sm font-medium px-3 py-1 rounded-full bg-background/50", getProfitColor(summary.profitPercentage))}>
              {getProfitLabel(summary.profitPercentage)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
            <div className="text-center p-2 sm:p-4 rounded-xl bg-card border border-border/50 overflow-hidden">
              <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Ganancia Neta</p>
              <p className={cn("text-sm sm:text-2xl font-bold tabular-nums truncate", getProfitColor(summary.profitPercentage))}>
                {currencySymbol}{summary.netProfit.toFixed(0)}
              </p>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-xl bg-card border border-border/50 overflow-hidden">
              <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Porcentaje</p>
              <p className={cn("text-sm sm:text-2xl font-bold tabular-nums", getProfitColor(summary.profitPercentage))}>
                {summary.profitPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-2 sm:p-4 rounded-xl bg-card border border-border/50 overflow-hidden">
              <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Por Hora</p>
              <p className={cn("text-sm sm:text-2xl font-bold tabular-nums truncate", getProfitColor(summary.profitPercentage))}>
                {currencySymbol}{summary.profitPerHour.toFixed(0)}
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
              left: `calc(${Math.min(Math.max(summary.profitPercentage, 0), 60)}% - 10px)`
            }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}