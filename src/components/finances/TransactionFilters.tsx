import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Day Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-day" className="text-xs">Día</Label>
          <Input
            id="filter-day"
            type="number"
            min="1"
            max="31"
            placeholder="Día"
            value={filters.day}
            onChange={(e) => handleChange('day', e.target.value)}
            className="h-9"
          />
        </div>

        {/* Month Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-month" className="text-xs">Mes</Label>
          <Select value={filters.month} onValueChange={(v) => handleChange('month', v)}>
            <SelectTrigger id="filter-month" className="h-9">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-year" className="text-xs">Año</Label>
          <Select value={filters.year} onValueChange={(v) => handleChange('year', v)}>
            <SelectTrigger id="filter-year" className="h-9">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-category" className="text-xs">Categoría</Label>
          <Select value={filters.category} onValueChange={(v) => handleChange('category', v)}>
            <SelectTrigger id="filter-category" className="h-9">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="space-y-1.5">
          <Label htmlFor="filter-type" className="text-xs">Tipo</Label>
          <Select value={filters.type} onValueChange={(v) => handleChange('type', v)}>
            <SelectTrigger id="filter-type" className="h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="w-3 h-3" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
