import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

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

export function MonthlyCharts({ transactions, currencySymbol }: MonthlyChartsProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { [key: string]: { income: number; expense: number; month: string; monthLabel: string } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthKey = format(startOfMonth(monthDate), 'yyyy-MM');
      months[monthKey] = {
        income: 0,
        expense: 0,
        month: monthKey,
        monthLabel: format(monthDate, 'MMM yyyy', { locale: es }),
      };
    }

    // Aggregate transactions by month
    transactions.forEach((t) => {
      const monthKey = format(parseISO(t.transaction_date), 'yyyy-MM');
      if (months[monthKey]) {
        if (t.type === 'income') {
          months[monthKey].income += Number(t.amount);
        } else {
          months[monthKey].expense += Number(t.amount);
        }
      }
    });

    return Object.values(months);
  }, [transactions]);

  const totalsData = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return [
      { name: 'Ingresos', value: totalIncome, color: COLORS.income },
      { name: 'Gastos', value: totalExpense, color: COLORS.expense },
    ];
  }, [transactions]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};

    transactions.forEach((t) => {
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
  }, [transactions]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Visualización de Finanzas</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="bar">Barras</TabsTrigger>
            <TabsTrigger value="pie-total">Totales</TabsTrigger>
            <TabsTrigger value="pie-category">Categorías</TabsTrigger>
          </TabsList>

          <TabsContent value="bar" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="monthLabel" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
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
              Últimos 6 meses de ingresos vs gastos
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
              Distribución total de ingresos vs gastos
            </p>
          </TabsContent>

          <TabsContent value="pie-category" className="mt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => percent > 0.05 ? `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    formatter={(value) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Distribución por categoría
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
