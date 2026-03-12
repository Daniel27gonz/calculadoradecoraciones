import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrencyByCode } from '@/lib/currencies';
import { IndirectExpensesManager } from '@/components/settings/IndirectExpensesManager';

export default function IndirectExpenses() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentCurrency = getCurrencyByCode(profile?.currency || 'USD');

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {user && (
          <IndirectExpensesManager currencySymbol={currentCurrency?.symbol || '$'} />
        )}
      </main>
    </div>
  );
}
