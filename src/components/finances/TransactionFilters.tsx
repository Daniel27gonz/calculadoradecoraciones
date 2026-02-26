import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  transaction_date: string;
  created_at: string;
}

interface TransactionFiltersProps {
  transactions: Transaction[];
  filters: {
    day: string;
    month: string;
    year: string;
    category: string;
    type: string;
  };
  onFiltersChange: (filters: {
    day: string;
    month: string;
    year: string;
    category: string;
    type: string;
  }) => void;
}

const MONTHS = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export function TransactionFilters({ transactions, filters, onFiltersChange }: TransactionFiltersProps) {
  // Get unique categories from transactions
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Get unique years from transactions
  const years = useMemo(() => {
    const yrs = new Set<string>();
    transactions.forEach(t => {
      const year = t.transaction_date.split('-')[0];
      yrs.add(year);
    });
    return Array.from(yrs).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const handleChange = (key: keyof typeof filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      day: '',
      month: '',
      year: '',
      category: '',
      type: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type Filter */}
      <Select value={filters.type || 'all_types'} onValueChange={(v) => handleChange('type', v === 'all_types' ? '' : v)}>
        <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-full border-border bg-background text-sm">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all_types">Todos los tipos</SelectItem>
          <SelectItem value="income">Ingresos</SelectItem>
          <SelectItem value="expense">Gastos</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select value={filters.category || 'all_categories'} onValueChange={(v) => handleChange('category', v === 'all_categories' ? '' : v)}>
        <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-full border-border bg-background text-sm">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all_categories">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month Filter */}
      <Select value={filters.month || 'all_months'} onValueChange={(v) => handleChange('month', v === 'all_months' ? '' : v)}>
        <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-full border-border bg-background text-sm">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all_months">Todos los meses</SelectItem>
          {MONTHS.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year Filter */}
      <Select value={filters.year || 'all_years'} onValueChange={(v) => handleChange('year', v === 'all_years' ? '' : v)}>
        <SelectTrigger className="h-9 w-auto min-w-[100px] rounded-full border-border bg-background text-sm">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all_years">Todos los años</SelectItem>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 rounded-full text-muted-foreground hover:text-foreground gap-1 px-3"
        >
          <X className="w-3 h-3" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
