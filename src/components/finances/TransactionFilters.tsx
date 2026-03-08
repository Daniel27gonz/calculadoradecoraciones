import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  filterType: string;
  filterCategory: string;
  onTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export function TransactionFilters({ transactions, filterType, filterCategory, onTypeChange, onCategoryChange }: TransactionFiltersProps) {
  // Get unique categories from the provided (already month-filtered) transactions
  const categories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type Filter */}
      <Select value={filterType} onValueChange={onTypeChange}>
        <SelectTrigger className="h-9 w-auto min-w-[110px] rounded-full border-border bg-background text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="income">Ingresos</SelectItem>
          <SelectItem value="expense">Gastos</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select value={filterCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-full border-border bg-background text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background z-50">
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
