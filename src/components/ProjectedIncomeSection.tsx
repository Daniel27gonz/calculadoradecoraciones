import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote, CostSummary } from '@/types/quote';

interface ProjectedIncomeSectionProps {
  quotes: Quote[];
  calculateCosts: (quote: Quote) => CostSummary;
  currencySymbol: string;
}

export function ProjectedIncomeSection({
  quotes,
  calculateCosts,
  currencySymbol,
}: ProjectedIncomeSectionProps) {
  const totalIncome = useMemo(() => {
    return quotes.reduce((sum, quote) => {
      const summary = calculateCosts(quote);
      return sum + summary.finalPrice;
    }, 0);
  }, [quotes, calculateCosts]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          Ingresos Proyectados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-rose-light/50 to-lavender-light/50 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Acumulado</p>
          <p className="font-display text-4xl font-bold text-foreground">
            {currencySymbol}{formatCurrency(totalIncome)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {quotes.length} {quotes.length === 1 ? 'cotización' : 'cotizaciones'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
