import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Edit2, Copy, Trash2, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';

export default function History() {
  const navigate = useNavigate();
  const { quotes, deleteQuote, duplicateQuote, calculateCosts, saveQuote, loadQuotes } = useQuote();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Reload quotes when component mounts
  useEffect(() => {
    if (user) {
      loadQuotes();
    }
  }, [user]);

  const filteredQuotes = quotes
    .filter(q => 
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.notes.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleEdit = (id: string) => {
    navigate(`/calculator?edit=${id}`);
  };

  const handleDuplicate = async (id: string) => {
    const newQuote = duplicateQuote(id);
    await saveQuote(newQuote);
    toast({
      title: "Cotización duplicada",
      description: "Se ha creado una copia de la cotización",
    });
    navigate(`/calculator?edit=${newQuote.id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteQuote(id);
    toast({
      title: "Cotización eliminada",
      description: `"${name}" ha sido eliminada`,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Historial</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o notas..."
            className="pl-10 h-12"
          />
        </div>

        {/* Quotes List */}
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'Sin cotizaciones'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Crea tu primera cotización para verla aquí'}
              </p>
              {!searchTerm && (
                <Button variant="gradient" onClick={() => navigate('/calculator')}>
                  Crear cotización
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => {
              const summary = calculateCosts(quote);
              const profitColor = summary.profitPercentage >= 40 
                ? 'text-profit-high' 
                : summary.profitPercentage >= 20 
                  ? 'text-profit-medium' 
                  : 'text-profit-low';

              return (
                <Card key={quote.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold">
                            {quote.clientName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(quote.createdAt), "d MMM yyyy", { locale: es })}
                            </span>
                            {quote.eventDate && (
                              <span className="flex items-center gap-1">
                                📅 {format(new Date(quote.eventDate), "d MMM", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{currencySymbol}{summary.finalPrice.toFixed(2)}</p>
                          <p className={`text-sm font-medium ${profitColor}`}>
                            +{currencySymbol}{summary.netProfit.toFixed(2)} ({summary.profitPercentage.toFixed(0)}%)
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 rounded-lg bg-rose-light/30">
                          <p className="text-sm font-semibold">{quote.balloons.reduce((s, b) => s + (b.quantity || 0), 0)}</p>
                          <p className="text-xs text-muted-foreground">Globos</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-lavender-light/30">
                          <p className="text-sm font-semibold">{quote.materials.length}</p>
                          <p className="text-xs text-muted-foreground">Materiales</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-secondary/50">
                          <p className="text-sm font-semibold">
                            {quote.timePhases.reduce((s, t) => s + (t.hours || 0), 0)}h
                          </p>
                          <p className="text-xs text-muted-foreground">Tiempo</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-nude/50">
                          <p className="text-sm font-semibold">{quote.marginPercentage}%</p>
                          <p className="text-xs text-muted-foreground">Margen</p>
                        </div>
                      </div>

                      {/* Notes preview */}
                      {quote.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {quote.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          variant="soft"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(quote.id)}
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDuplicate(quote.id)}
                        >
                          <Copy className="w-4 h-4" />
                          Duplicar
                        </Button>
                        <Button variant="outline" size="icon" disabled>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(quote.id, quote.clientName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
