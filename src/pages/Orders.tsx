import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar as CalendarIcon, CheckCircle2, Clock, Eye, Edit2, ChevronDown, ChevronUp, Plus, Trash2, DollarSign, CircleCheck, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';
import { QuoteImageModal } from '@/components/QuoteImageModal';
import { Quote } from '@/types/quote';
import { OrdersCalendar } from '@/components/orders/OrdersCalendar';

interface QuotePayment {
  id: string;
  quote_id: string;
  user_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  is_paid: boolean;
  created_at: string;
}

export default function Orders() {
  const navigate = useNavigate();
  const { quotes, calculateCosts, saveQuote, loadQuotes } = useQuote();
  const { user, profile, isApproved, approvalStatus, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, QuotePayment[]>>({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentQuoteId, setPaymentQuoteId] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [fullyPaidQuotes, setFullyPaidQuotes] = useState<Set<string>>(new Set());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showFullPaidDialog, setShowFullPaidDialog] = useState(false);
  const [fullPaidQuote, setFullPaidQuote] = useState<Quote | null>(null);
  const [fullPaidDate, setFullPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const currencySymbol = getCurrencyByCode(profile?.currency || 'USD')?.symbol || '$';

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      loadQuotes();
      loadAllPayments();
    }
  }, [user]);

  const loadAllPayments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quote_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: true });

      if (error) throw error;
      if (data) {
        const grouped: Record<string, QuotePayment[]> = {};
        data.forEach((p: any) => {
          if (!grouped[p.quote_id]) grouped[p.quote_id] = [];
          grouped[p.quote_id].push(p);
        });
        setPayments(grouped);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleAddPayment = async () => {
    if (!user || !paymentQuoteId || !newPaymentAmount) return;
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Ingresa un monto válido", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('quote_payments').insert({
        quote_id: paymentQuoteId,
        user_id: user.id,
        amount,
        payment_date: newPaymentDate,
        notes: newPaymentNotes || null,
      });

      if (error) throw error;

      // Register anticipo in finances
      const relatedQuote = quotes.find(q => q.id === paymentQuoteId);
      const clientName = relatedQuote?.clientName || 'Cliente';
      const folioLabel = relatedQuote?.folio ? `#${String(relatedQuote.folio).padStart(4, '0')}` : '';
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'income',
        amount,
        description: `Anticipo: ${clientName}${folioLabel ? ` - Folio ${folioLabel}` : ''}`,
        category: 'Anticipos',
        transaction_date: newPaymentDate,
      });

      toast({ title: "Anticipo registrado", description: `${currencySymbol}${amount.toFixed(2)} registrado en Finanzas` });
      setShowPaymentDialog(false);
      setNewPaymentAmount('');
      setNewPaymentNotes('');
      setNewPaymentDate(new Date().toISOString().split('T')[0]);
      loadAllPayments();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({ title: "Error", description: "No se pudo registrar el anticipo", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase.from('quote_payments').delete().eq('id', paymentId);
      if (error) throw error;
      toast({ title: "Anticipo eliminado" });
      loadAllPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleToggleFullyPaid = async (quote: Quote, isCurrentlyPaid: boolean, paymentDate?: string) => {
    const summary = calculateCosts(quote);
    try {
      if (!isCurrentlyPaid) {
        const folioLabel = quote.folio ? `#${String(quote.folio).padStart(4, '0')}` : quote.id;
        await supabase.from('transactions').insert({
          user_id: user!.id,
          type: 'income',
          amount: summary.finalPrice,
          description: `Pago completo: ${quote.clientName} - Folio ${folioLabel}`,
          category: 'Pagos completos',
          transaction_date: paymentDate || new Date().toISOString().split('T')[0],
        });
        toast({ title: "Pedido marcado como pagado", description: `${currencySymbol}${summary.finalPrice.toFixed(2)} registrado en Finanzas` });
      } else {
        const folioLabel = quote.folio ? `#${String(quote.folio).padStart(4, '0')}` : quote.id;
        await supabase.from('transactions').delete()
          .eq('user_id', user!.id)
          .like('description', `%Folio ${folioLabel}%`);
        toast({ title: "Pedido desmarcado", description: "Ingreso removido de Finanzas" });
      }
    } catch (error) {
      console.error('Error toggling fully paid:', error);
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  };

  useEffect(() => {
    const loadFullyPaid = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('transactions')
        .select('description')
        .eq('user_id', user.id)
        .eq('category', 'Pagos completos');
      if (data) {
        const ids = new Set<string>();
        data.forEach(t => {
          // Match by folio in description
          quotes.forEach(q => {
            const folioLabel = q.folio ? `#${String(q.folio).padStart(4, '0')}` : q.id;
            if (t.description.includes(`Folio ${folioLabel}`)) {
              ids.add(q.id);
            }
          });
        });
        setFullyPaidQuotes(ids);
      }
    };
    loadFullyPaid();
  }, [user, quotes]);

  const filteredQuotes = quotes
    .filter(q => {
      const matchesSearch = q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && q.status === 'approved';
    })
    .sort((a, b) => {
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

    if (user && newStatus === 'approved') {
      // Deduct materials from inventory based on quote materials
      try {
        // Get user's inventory materials
        const { data: inventoryMaterials } = await supabase
          .from('user_materials')
          .select('id, name')
          .eq('user_id', user.id);

        if (inventoryMaterials && quote.materials.length > 0) {
          const deductions = quote.materials
            .map(qm => {
              const match = inventoryMaterials.find(
                im => im.name.toLowerCase() === qm.name.toLowerCase()
              );
              if (match) {
                return {
                  user_id: user.id,
                  quote_id: quote.id,
                  material_id: match.id,
                  quantity_deducted: qm.quantity,
                };
              }
              return null;
            })
            .filter(Boolean);

          if (deductions.length > 0) {
            await supabase.from('stock_deductions').insert(deductions);
          }
        }
      } catch (e) {
        console.error('Error deducting materials:', e);
      }
    } else if (user && newStatus === 'pending') {
      // Revert: remove deductions for this quote
      try {
        await supabase
          .from('stock_deductions')
          .delete()
          .eq('user_id', user.id)
          .eq('quote_id', quote.id);
      } catch (e) {
        console.error('Error reverting deductions:', e);
      }
    }

    toast({
      title: newStatus === 'approved' ? "Pedido aprobado" : "Pedido pendiente",
      description: newStatus === 'approved'
        ? `"${quote.clientName}" aprobado - materiales descontados del inventario`
        : `"${quote.clientName}" revertido a pendiente - materiales restaurados`,
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

        {/* Calendar Toggle */}
        <div className="flex justify-end">
          <Button
            variant={showCalendar ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowCalendar(!showCalendar)}
            className="gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Agenda
          </Button>
        </div>

        {/* Calendar */}
        {showCalendar && (
          <OrdersCalendar
            quotes={quotes.filter(q => q.status === 'approved')}
            onSelectQuote={(q) => setExpandedQuoteId(expandedQuoteId === q.id ? null : q.id)}
          />
        )}

        {/* Filters */}
        <div className="space-y-3">
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
              const quotePayments = payments[quote.id] || [];
              const totalPaid = quotePayments.reduce((sum, p) => sum + p.amount, 0);
              const balance = summary.finalPrice - totalPaid;
              const isExpanded = expandedQuoteId === quote.id;

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
                        {quote.folio && (
                          <p className="text-xs text-muted-foreground font-mono">Folio #{String(quote.folio).padStart(4, '0')}</p>
                        )}
                        {quote.eventType && (
                          <p className="text-sm text-muted-foreground">{quote.eventType}</p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {quote.eventDate && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {format(new Date(quote.eventDate + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-lg sm:text-xl font-bold">{currencySymbol}{summary.finalPrice.toFixed(2)}</p>
                        {totalPaid > 0 && (
                          <p className={`text-xs font-medium ${balance <= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {balance <= 0 ? '✓ Pagado' : `Saldo: ${currencySymbol}${balance.toFixed(2)}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-1 pt-2 border-t border-border overflow-hidden">
                      <div className="flex gap-1 shrink-0">
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
                          size="sm"
                          className="h-9 gap-1"
                          onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                        >
                          <span className="text-xs">Registrar</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Deposits Section */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-border space-y-3 animate-fade-in">
                        {/* Quote details */}
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cliente:</span>
                            <span className="font-medium">{quote.clientName}</span>
                          </div>
                          {quote.folio && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Folio:</span>
                              <span className="font-mono font-medium">#{String(quote.folio).padStart(4, '0')}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monto total:</span>
                            <span className="font-bold">{currencySymbol}{summary.finalPrice.toFixed(2)}</span>
                          </div>
                          {quote.decorationDescription && (
                            <div>
                              <span className="text-muted-foreground">Descripción:</span>
                              <p className="mt-1 text-foreground">{quote.decorationDescription}</p>
                            </div>
                          )}
                        </div>

                        {/* Payment summary */}
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-muted/30 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-sm">{currencySymbol}{summary.finalPrice.toFixed(2)}</p>
                          </div>
                          <div className="bg-green-500/10 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Anticipos</p>
                            <p className="font-bold text-sm text-green-600">{currencySymbol}{totalPaid.toFixed(2)}</p>
                          </div>
                          <div className={`rounded-lg p-2 ${balance <= 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                            <p className="text-xs text-muted-foreground">Saldo</p>
                            <p className={`font-bold text-sm ${balance <= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {currencySymbol}{Math.max(0, balance).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Payment list */}
                        {quotePayments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historial de anticipos</p>
                            {quotePayments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30">
                                <div>
                                  <p className="text-sm font-medium">
                                    {currencySymbol}{payment.amount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(payment.payment_date + 'T12:00:00'), "d MMM yyyy", { locale: es })}
                                    {payment.notes && ` • ${payment.notes}`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeletePayment(payment.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add payment button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setPaymentQuoteId(quote.id);
                            setShowPaymentDialog(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Registrar anticipo
                        </Button>

                        {/* Fully paid button */}
                        {fullyPaidQuotes.has(quote.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-green-600 text-green-600"
                            onClick={async () => {
                              await handleToggleFullyPaid(quote, true);
                              setFullyPaidQuotes(prev => {
                                const next = new Set(prev);
                                next.delete(quote.id);
                                return next;
                              });
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Pagado ✓
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              setFullPaidQuote(quote);
                              setFullPaidDate(new Date().toISOString().split('T')[0]);
                              setShowFullPaidDialog(true);
                            }}
                          >
                            <CircleCheck className="w-4 h-4 mr-1" /> Marcar pago completo
                          </Button>
                        )}

                        {/* Entregado button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Entregado
                        </Button>
                      </div>
                    )}
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

        {/* Add Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar anticipo</DialogTitle>
              <DialogDescription>
                Registra un pago parcial o anticipo para este pedido.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Monto ({currencySymbol})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPaymentAmount}
                  onChange={(e) => setNewPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={newPaymentDate}
                  onChange={(e) => setNewPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  value={newPaymentNotes}
                  onChange={(e) => setNewPaymentNotes(e.target.value)}
                  placeholder="Ej: Anticipo en efectivo"
                />
              </div>
              <Button className="w-full" onClick={handleAddPayment}>
                Registrar anticipo
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full Payment Date Dialog */}
        <Dialog open={showFullPaidDialog} onOpenChange={setShowFullPaidDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pago completo</DialogTitle>
              <DialogDescription>
                Selecciona la fecha en que se realizó el pago completo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha de pago</Label>
                <Input
                  type="date"
                  value={fullPaidDate}
                  onChange={(e) => setFullPaidDate(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={async () => {
                  if (fullPaidQuote) {
                    await handleToggleFullyPaid(fullPaidQuote, false, fullPaidDate);
                    setFullyPaidQuotes(prev => {
                      const next = new Set(prev);
                      next.add(fullPaidQuote.id);
                      return next;
                    });
                    setShowFullPaidDialog(false);
                    setFullPaidQuote(null);
                  }
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Confirmar pago completo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
