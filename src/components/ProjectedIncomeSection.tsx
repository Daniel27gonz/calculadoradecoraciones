import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote, CostSummary } from '@/types/quote';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const { totalIncome, quotesInRange } = useMemo(() => {
    if (!dateRange?.from) {
      return { totalIncome: 0, quotesInRange: 0 };
    }

    const from = startOfDay(dateRange.from);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    const filteredQuotes = quotes.filter((quote) => {
      const quoteDate = new Date(quote.eventDate || quote.createdAt);
      return isWithinInterval(quoteDate, { start: from, end: to });
    });

    const total = filteredQuotes.reduce((sum, quote) => {
      const summary = calculateCosts(quote);
      return sum + summary.finalPrice;
    }, 0);

    return { totalIncome: total, quotesInRange: filteredQuotes.length };
  }, [quotes, dateRange, calculateCosts]);

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
      <CardContent className="space-y-6">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            locale={es}
            numberOfMonths={1}
            className="rounded-xl border border-border"
          />
        </div>

        {/* Date Range Display */}
        {dateRange?.from && (
          <div className="text-center text-sm text-muted-foreground">
            {dateRange.to ? (
              <>
                Del {format(dateRange.from, "d 'de' MMMM", { locale: es })} al{' '}
                {format(dateRange.to, "d 'de' MMMM, yyyy", { locale: es })}
              </>
            ) : (
              format(dateRange.from, "d 'de' MMMM, yyyy", { locale: es })
            )}
          </div>
        )}

        {/* Total Card */}
        <div className="bg-gradient-to-br from-rose-light/50 to-lavender-light/50 rounded-2xl p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Acumulado</p>
          <p className="font-display text-4xl font-bold text-foreground">
            {currencySymbol}{formatCurrency(totalIncome)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {quotesInRange} {quotesInRange === 1 ? 'cotización' : 'cotizaciones'} en este rango
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
