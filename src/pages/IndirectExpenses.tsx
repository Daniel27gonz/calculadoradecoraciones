import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencyByCode } from '@/lib/currencies';
import { IndirectExpensesManager } from '@/components/settings/IndirectExpensesManager';

export default function IndirectExpenses() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');

  const handleEventsPerMonthChange = (value: number) => {
    if (user && profile) {
      updateProfile({ events_per_month: value });
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Gastos Indirectos</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Eventos por mes</CardTitle>
                  <CardDescription>
                    ¿Cuántos eventos realizas en promedio al mes?
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="1"
                  value={profile?.events_per_month ?? 4}
                  onChange={(e) => handleEventsPerMonthChange(e.target.value === '' ? 1 : Number(e.target.value))}
                  placeholder="4"
                  className="text-2xl font-bold h-14 w-32"
                />
                <span className="text-muted-foreground">eventos/mes</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Este dato se usa para calcular el costo de gastos indirectos por evento.
              </p>
            </CardContent>
          </Card>
        )}

        {user && (
          <IndirectExpensesManager currencySymbol={currentCurrency?.symbol || '$'} />
        )}
      </main>
    </div>
  );
}
