import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NumericField } from '@/components/ui/numeric-field';
import { CostSummary } from '@/types/quote';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIndirectExpenses } from '@/hooks/useIndirectExpenses';

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
  const { profile } = useAuth();
  const { getLatestMonthTotal } = useIndirectExpenses();
  const indirectExpensesTotal = getLatestMonthTotal();

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
            <CostLine icon="🎀" label="Material que se gasta" amount={summary.totalMaterials} />
            <CostLine icon="🧮" label="Renta de equipo" amount={summary.totalReusableMaterials} />
            <CostLine icon="📉" label={`Desperdicio (${wastagePercentage}%)`} amount={summary.wastage} highlighted />
            <CostLine icon="👩‍🎨" label="Mi trabajo (mano de obra)" amount={summary.totalLabor} />
            <CostLine icon="🚗" label="Total transporte" amount={summary.totalTransport} />
            
            <CostLine icon="✨" label="Total extras" amount={summary.totalExtras} />
            <CostLine 
              icon="📊" 
              label="Gastos del negocio" 
              sublabel={
                <span className="text-xs text-muted-foreground">
                  ({formatCurrency(indirectExpensesTotal)}/mes ÷ {eventsPerMonth} eventos)
                </span>
              }
              amount={summary.indirectExpenses} 
              highlighted 
            />
          </div>
        </CardContent>
      </Card>

      {/* Margin Selection */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">💰</span>
            <span>Elige tu Margen de Ganancia</span>
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
        </CardContent>
      </Card>

      {/* Results: 3 blocks */}
      <div className="space-y-3">
        {/* 1. Costo por evento - neutral gray */}
        <Card className="shadow-card border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 sm:p-5" style={{ backgroundColor: '#F5F6F8' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🧾</span>
                  <span className="font-semibold text-sm sm:text-base" style={{ color: '#4A4A4A' }}>
                    Costo por evento
                  </span>
                </div>
                <span className="text-lg sm:text-2xl font-bold tabular-nums" style={{ color: '#1A1A1A' }}>
                  {formatCurrency(summary.totalCost)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Precio sugerido al cliente - brand gradient */}
        <Card className="shadow-elevated border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #E0527D, #F38DA8)' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">💎</span>
                  <span className="text-white font-bold text-sm sm:text-lg">
                    Precio sugerido al cliente
                  </span>
                </div>
                <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tabular-nums truncate">
                  {formatCurrency(summary.finalPrice)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Tu ganancia - green */}
        <Card className="shadow-card border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-4 sm:p-5" style={{ backgroundColor: '#0FA968' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🤑</span>
                  <span className="text-white font-bold text-sm sm:text-lg">
                    Tu ganancia
                  </span>
                </div>
                <span className="text-xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums truncate">
                  {formatCurrency(summary.netProfit)}
                </span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm mt-1 text-right">
                {summary.profitPercentage.toFixed(0)}% de margen · {formatCurrency(summary.profitPerHour)}/hora
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit Analysis - warm orange */}
      <Card className="shadow-card border-0 overflow-hidden">
        <div className="p-1" style={{ backgroundColor: '#F5A623' }}>
          <div className="bg-card rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="flex items-center gap-2 text-lg sm:text-xl">
                  <span className="text-xl sm:text-2xl">📈</span>
                  <span>Análisis de Rentabilidad</span>
                </span>
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", getProfitColor(summary.profitPercentage))} style={{ backgroundColor: 'rgba(245, 166, 35, 0.15)' }}>
                  {getProfitLabel(summary.profitPercentage)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
                <div className="text-center p-2 sm:p-4 rounded-xl border border-border/50 overflow-hidden" style={{ backgroundColor: '#FFF8EE' }}>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Ganancia Neta</p>
                  <p className={cn("text-sm sm:text-2xl font-bold tabular-nums truncate", getProfitColor(summary.profitPercentage))}>
                    {currencySymbol}{summary.netProfit.toFixed(0)}
                  </p>
                </div>
                <div className="text-center p-2 sm:p-4 rounded-xl border border-border/50 overflow-hidden" style={{ backgroundColor: '#FFF8EE' }}>
                  <p className="text-[9px] sm:text-xs text-muted-foreground mb-1">Porcentaje</p>
                  <p className={cn("text-sm sm:text-2xl font-bold tabular-nums", getProfitColor(summary.profitPercentage))}>
                    {summary.profitPercentage.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-2 sm:p-4 rounded-xl border border-border/50 overflow-hidden" style={{ backgroundColor: '#FFF8EE' }}>
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
          </div>
        </div>
      </Card>
    </div>;
}