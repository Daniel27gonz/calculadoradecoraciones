import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  transaction_date: string;
  created_at: string;
}

interface MonthlyChartsProps {
  transactions: Transaction[];
  currencySymbol: string;
}

const COLORS = {
  income: 'hsl(142, 76%, 36%)',
  expense: 'hsl(0, 84%, 60%)',
};

const PIE_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(262, 83%, 58%)',
  'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)',
  'hsl(24, 95%, 53%)',
  'hsl(330, 81%, 60%)',
];

type DateRange = '7d' | '14d' | '30d' | 'custom';

export function MonthlyCharts({ transactions, currencySymbol }: MonthlyChartsProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const { start, end } = useMemo(() => {
    const now = new Date();
    if (dateRange === 'custom' && customFrom && customTo) {
      return { start: startOfDay(customFrom), end: endOfDay(customTo) };
    }
    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    return { start: startOfDay(subDays(now, days)), end: endOfDay(now) };
  }, [dateRange, customFrom, customTo]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = parseISO(t.transaction_date);
      return isWithinInterval(d, { start, end });
    });
  }, [transactions, start, end]);

  const dailyData = useMemo(() => {
    const days: { [key: string]: { income: number; expense: number; day: string; dayLabel: string } } = {};

    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i <= diff; i++) {
      const d = subDays(end, diff - i);
      const key = format(d, 'yyyy-MM-dd');
      days[key] = {
        income: 0,
        expense: 0,
        day: key,
        dayLabel: format(d, 'd MMM', { locale: es }),
      };
    }

    filteredTransactions.forEach((t) => {
      const key = t.transaction_date;
      if (days[key]) {
        if (t.type === 'income') {
          days[key].income += Number(t.amount);
        } else {
          days[key].expense += Number(t.amount);
        }
      }
    });

    return Object.values(days);
  }, [filteredTransactions, start, end]);

  const totalsData = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [
      { name: 'Ingresos', value: totalIncome, color: COLORS.income },
      { name: 'Gastos', value: totalExpense, color: COLORS.expense },
    ];
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};

    filteredTransactions.forEach((t) => {
      const cat = t.category || 'Sin categoría';
      if (!categories[cat]) {
        categories[cat] = 0;
      }
      categories[cat] += Number(t.amount);
    });

    return Object.entries(categories)
      .map(([name, value], index) => ({
        name,
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {currencySymbol}{entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {currencySymbol}{payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return null;
  }

  const rangeLabel = dateRange === 'custom' && customFrom && customTo
    ? `${format(customFrom, 'd MMM', { locale: es })} - ${format(customTo, 'd MMM', { locale: es })}`
    : dateRange === '7d' ? 'Últimos 7 días'
    : dateRange === '14d' ? 'Últimos 14 días'
    : 'Últimos 30 días';

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-lg">Visualización de Finanzas</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {(['7d', '14d', '30d'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs h-8"
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? '7 días' : range === '14d' ? '14 días' : '30 días'}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full text-xs h-8 gap-1"
              >
                <CalendarIcon className="w-3 h-3" />
                {dateRange === 'custom' && customFrom && customTo
                  ? `${format(customFrom, 'd/MM', { locale: es })} - ${format(customTo, 'd/MM', { locale: es })}`
                  : 'Personalizado'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-3">
                <p className="text-sm font-medium">Desde</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={(d) => {
                    setCustomFrom(d);
                    if (d) setDateRange('custom');
                  }}
                  className={cn("p-0 pointer-events-auto")}
                  initialFocus
                />
                <p className="text-sm font-medium">Hasta</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={(d) => {
                    setCustomTo(d);
                    if (d) setDateRange('custom');
                  }}
                  className={cn("p-0 pointer-events-auto")}
                  disabled={(date) => customFrom ? date < customFrom : false}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bar">Barras</TabsTrigger>
            <TabsTrigger value="pie-total">Totales</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="dayLabel" 
                    tick={{ fontSize: 10 }}
                    className="text-muted-foreground"
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    tickFormatter={(value) => `${currencySymbol}${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="income" 
                    name="Ingresos" 
                    fill={COLORS.income} 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="expense" 
                    name="Gastos" 
                    fill={COLORS.expense} 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {rangeLabel}
            </p>
          </TabsContent>

          <TabsContent value="pie-total" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totalsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {totalsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {rangeLabel} — Ingresos vs Gastos
            </p>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
