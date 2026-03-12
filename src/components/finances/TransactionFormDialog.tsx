import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string | null;
  transaction_date: string;
}

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  onSaved: () => void;
}

const INCOME_CATEGORIES = [
  'Evento',
  'Venta de productos',
  'Servicio adicional',
  'Otro ingreso',
];

const EXPENSE_CATEGORIES = [
  'Materiales',
  'Transporte',
  'Alquiler',
  'Servicios',
  'Marketing',
  'Herramientas',
  'Personal',
  'Otro gasto',
];

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
}: TransactionFormDialogProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategory(transaction.category || '');
      setDate(new Date(transaction.transaction_date + 'T12:00:00'));
    } else {
      setType('income');
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date());
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar transacciones",
        variant: "destructive",
      });
      return;
    }

    if (!amount || !description) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const transactionData = {
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        description: description.trim(),
        category: category || null,
        transaction_date: format(date, 'yyyy-MM-dd'),
      };

      if (transaction) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id);

        if (error) throw error;

        toast({
          title: "Transacción actualizada",
          description: "Los cambios se guardaron correctamente",
        });
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('transactions')
          .insert(transactionData);

        if (error) throw error;

        toast({
          title: "Transacción guardada",
          description: "La transacción se registró correctamente",
        });
      }

      onSaved();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la transacción",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transacción' : 'Nueva Transacción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Tipo de transacción</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'income' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'income' && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
              >
                Ingreso
              </Button>
              <Button
                type="button"
                variant={type === 'expense' ? 'default' : 'outline'}
                className={cn(
                  "flex-1",
                  type === 'expense' && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
              >
                Gasto
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="Ej: Pago por evento de cumpleaños"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoría (opcional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Guardando...' : transaction ? 'Actualizar' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
