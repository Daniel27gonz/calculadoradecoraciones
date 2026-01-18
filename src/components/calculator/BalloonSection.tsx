import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Balloon } from '@/types/quote';
interface BalloonSectionProps {
  balloons: Balloon[];
  onChange: (balloons: Balloon[]) => void;
  currencySymbol?: string;
}
export function BalloonSection({
  balloons,
  onChange,
  currencySymbol = '$'
}: BalloonSectionProps) {
  const addBalloon = () => {
    onChange([...balloons, {
      id: crypto.randomUUID(),
      description: '',
      pricePerUnit: undefined as unknown as number,
      quantity: undefined as unknown as number
    }]);
  };
  const updateBalloon = (id: string, updates: Partial<Balloon>) => {
    onChange(balloons.map(b => b.id === id ? {
      ...b,
      ...updates
    } : b));
  };
  const removeBalloon = (id: string) => {
    onChange(balloons.filter(b => b.id !== id));
  };
  const total = balloons.reduce((sum, b) => sum + (b.pricePerUnit || 0) * (b.quantity || 0), 0);
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  return;
}