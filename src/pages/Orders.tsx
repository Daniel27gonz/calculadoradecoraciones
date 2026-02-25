import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, CheckCircle2, Clock, Eye, Share2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';
import { QuoteImageModal } from '@/components/QuoteImageModal';
import { Quote } from '@/types/quote';

export default function Orders() {
  const navigate = useNavigate();
  const { quotes, calculateCosts, saveQuote, loadQuotes } = useQuote();
  const { user, profile, isApproved, approvalStatus, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (user) loadQuotes();
  }, [user]);

  const filteredQuotes = quotes
    .filter(q => {
      const matchesSearch = q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by event date (upcoming first), then by creation date
      if (a.eventDate && b.eventDate) {
        return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      }
      if (a.eventDate) return -1;
      if (b.eventDate) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleToggleStatus = async (quote: Quote) => {
    const newStatus = quote.status === 'approved' ? 'pending' : 'approved';
    const updatedQuote = { ...quote, status: newStatus as 'pending' | 'approved' };
    await saveQuote(updatedQuote);
    toast({
      title: newStatus === 'approved' ? "Pedido aprobado" : "Pedido pendiente",
      description: `"${quote.clientName}" marcado como ${newStatus === 'approved' ? 'aprobado' : 'pendiente'}`,
    });
  };

  const pendingCount = quotes.filter(q => q.status === 'pending').length;
  const approvedCount = quotes.filter(q => q.status === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">📦</div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Pedidos</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="cursor-pointer" onClick={() => setStatusFilter('all')}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{quotes.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer border-yellow-500/30" onClick={() => setStatusFilter('pending')}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer border-green-500/30" onClick={() => setStatusFilter('approved')}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Aprobados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">Pendientes</TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">Aprobados</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente..."
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredQuotes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No se encontraron pedidos' : 'Sin pedidos'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Intenta con otros filtros'
                  : 'Las cotizaciones aparecerán aquí como pedidos'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuotes.map((quote) => {
              const summary = calculateCosts(quote);

              return (
                <Card key={quote.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-lg font-semibold">{quote.clientName}</h3>
                          <Badge
                            variant={quote.status === 'approved' ? 'default' : 'secondary'}
                            className={`text-xs ${quote.status === 'approved' ? 'bg-green-600 text-white' : 'bg-yellow-500/20 text-yellow-700'}`}
                          >
                            {quote.status === 'approved' ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobada</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" /> Pendiente</>
                            )}
                          </Badge>
                        </div>
                        {quote.eventType && (
                          <p className="text-sm text-muted-foreground">{quote.eventType}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {quote.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(quote.eventDate + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{currencySymbol}{summary.finalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setSelectedQuote(quote);
                            setShowImageModal(true);
                          }}
                          title="Ver cotización"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => navigate(`/calculator?edit=${quote.id}`)}
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant={quote.status === 'approved' ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleStatus(quote)}
                        className={quote.status === 'approved' ? '' : 'bg-green-600 hover:bg-green-700 text-white'}
                      >
                        {quote.status === 'approved' ? (
                          <><Clock className="w-4 h-4 mr-1" /> Marcar pendiente</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4 mr-1" /> Aprobar</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quote Image Modal */}
        {selectedQuote && (
          <QuoteImageModal
            open={showImageModal}
            onOpenChange={(open) => {
              setShowImageModal(open);
              if (!open) setSelectedQuote(null);
            }}
            quote={selectedQuote}
            summary={calculateCosts(selectedQuote)}
            currencySymbol={currencySymbol}
          />
        )}
      </main>
    </div>
  );
}
