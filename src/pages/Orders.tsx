import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, Clock, ChevronDown, ChevronUp, Trash2, CalendarDays, ListFilter, PackageCheck, CreditCard, Truck, XCircle, Ban, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { CancelledSubscription } from '@/components/CancelledSubscription';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';
import { Quote } from '@/types/quote';

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
  const { user, profile, isApproved, approvalStatus, isAdmin, isCancelled, loading } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'delivered' | 'paid' | 'cancelled'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [payments, setPayments] = useState<Record<string, QuotePayment[]>>({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentQuoteId, setPaymentQuoteId] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [fullyPaidQuotes, setFullyPaidQuotes] = useState<Set<string>>(new Set());
  const [editingPayment, setEditingPayment] = useState<QuotePayment | null>(null);

  // Accordion selector
  const [showAccordion, setShowAccordion] = useState(false);
  const [accordionSearch, setAccordionSearch] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const currency = getCurrencyByCode(profile?.currency || 'USD');
  const currencySymbol = currency?.symbol || '$';

  // Quotes that have been converted to orders (approved or delivered)
  const orderQuotes = useMemo(() => {
    return quotes.filter(q => q.status === 'approved' || q.status === 'delivered' || q.status === 'cancelled');
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    return orderQuotes.filter(q => {
      const matchesSearch = q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.eventType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.folio ? String(q.folio).includes(searchTerm) : false);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'approved' && q.status === 'approved') ||
        (statusFilter === 'delivered' && q.status === 'delivered') ||
        (statusFilter === 'paid' && fullyPaidQuotes.has(q.id)) ||
        (statusFilter === 'cancelled' && q.status === 'cancelled');
      const matchesMonth = monthFilter === 'all' || (() => {
        if (!q.eventDate) return false;
        const eventMonth = q.eventDate.substring(0, 7); // 'YYYY-MM'
        return eventMonth === monthFilter;
      })();
      return matchesSearch && matchesStatus && matchesMonth;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orderQuotes, searchTerm, statusFilter, fullyPaidQuotes, monthFilter]);

  // Available months from order event dates
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    orderQuotes.forEach(q => {
      if (q.eventDate) {
        months.add(q.eventDate.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [orderQuotes]);

  // All quotes for accordion selector (only pending ones that haven't been converted)
  const pendingQuotes = useMemo(() => {
    return quotes
      .filter(q => q.status === 'pending')
      .filter(q =>
        q.clientName.toLowerCase().includes(accordionSearch.toLowerCase()) ||
        (q.eventType || '').toLowerCase().includes(accordionSearch.toLowerCase()) ||
        (q.folio ? String(q.folio).includes(accordionSearch) : false)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, accordionSearch]);

  // Calendar events
  const calendarEvents = useMemo(() => {
    const events: Record<string, Quote[]> = {};
    orderQuotes.filter(q => q.status !== 'cancelled').forEach(q => {
      if (q.eventDate) {
        const dateKey = q.eventDate.split('T')[0];
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push(q);
      }
    });
    return events;
  }, [orderQuotes]);

  // Load payments
  useEffect(() => {
    if (!user) return;
    loadPayments();
  }, [user, orderQuotes]);

  const loadPayments = async () => {
    if (!user) return;
    const quoteIds = orderQuotes.map(q => q.id);
    if (quoteIds.length === 0) return;

    const { data, error } = await supabase
      .from('quote_payments')
      .select('*')
      .eq('user_id', user.id)
      .in('quote_id', quoteIds);

    if (error) {
      console.error('Error loading payments:', error);
      return;
    }

    const grouped: Record<string, QuotePayment[]> = {};
    (data || []).forEach((p: QuotePayment) => {
      if (!grouped[p.quote_id]) grouped[p.quote_id] = [];
      grouped[p.quote_id].push(p);
    });
    setPayments(grouped);

    // Determine fully paid quotes by comparing totalPaid >= finalPrice
    const paid = new Set<string>();
    orderQuotes.forEach(q => {
      const costs = calculateCosts(q);
      const totalPaid = (grouped[q.id] || []).reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid > 0 && totalPaid >= costs.finalPrice) {
        paid.add(q.id);
      }
    });
    setFullyPaidQuotes(paid);
  };

  // Deduct materials from inventory when converting to order
  const deductMaterials = async (quote: Quote) => {
    if (!user) return;
    // Get user materials to match by name
    const { data: userMaterials } = await supabase
      .from('user_materials')
      .select('id, name')
      .eq('user_id', user.id);

    if (!userMaterials || userMaterials.length === 0) return;

    // Aggregate quantities by material_id to avoid unique constraint violations
    const aggregated: Record<string, number> = {};

    // Match quote materials with inventory by name (case-insensitive)
    for (const qMat of quote.materials) {
      const match = userMaterials.find(m => m.name.toLowerCase() === qMat.name.toLowerCase());
      if (match && qMat.quantity > 0) {
        aggregated[match.id] = (aggregated[match.id] || 0) + qMat.quantity;
      }
    }

    // Also match balloons by name
    for (const balloon of quote.balloons) {
      const match = userMaterials.find(m => m.name.toLowerCase() === balloon.description.toLowerCase());
      if (match && balloon.quantity > 0) {
        aggregated[match.id] = (aggregated[match.id] || 0) + balloon.quantity;
      }
    }

    const deductions = Object.entries(aggregated).map(([material_id, quantity_deducted]) => ({
      material_id,
      quantity_deducted,
      quote_id: quote.id,
      user_id: user.id,
    }));

    if (deductions.length > 0) {
      await supabase.from('stock_deductions').insert(deductions);
    }
  };

  // Remove stock deductions when deleting an order
  const removeDeductions = async (quoteId: string) => {
    if (!user) return;
    await supabase.from('stock_deductions').delete().eq('quote_id', quoteId).eq('user_id', user.id);
  };

  // Convert quote to order (change status to approved)
  const convertToOrder = async (quote: Quote) => {
    const updated = { ...quote, status: 'approved' as const };
    // saveQuote will auto-recalculate stock deductions since status is 'approved'
    await saveQuote(updated);
    toast({ title: '✅ Pedido creado', description: `${quote.clientName} ahora es un pedido activo.` });
    await loadQuotes();
  };

  // Mark as delivered and open payment dialog
  const markAsDelivered = async (quote: Quote) => {
    const updated = { ...quote, status: 'delivered' as const };
    await saveQuote(updated);
    toast({ title: '📦 Decoración realizada', description: `${quote.clientName} marcado como entregado.` });
    await loadQuotes();
    // Open payment dialog automatically
    setPaymentQuoteId(quote.id);
    setNewPaymentAmount('');
    setNewPaymentNotes('');
    setShowPaymentDialog(true);
  };

  // Cancel order (removes stock deductions automatically via saveQuote, and cleans payments + transactions)
  const cancelOrder = async (quote: Quote) => {
    const updated = { ...quote, status: 'cancelled' as const };
    await saveQuote(updated);
    // Remove payments and related transactions
    await supabase.from('quote_payments').delete().eq('quote_id', quote.id).eq('user_id', user!.id);
    await supabase.from('transactions').delete().eq('reference_id', quote.id).eq('user_id', user!.id);
    toast({ title: '❌ Pedido cancelado', description: `${quote.clientName} ha sido cancelado. Los materiales fueron devueltos al inventario.` });
    await loadPayments();
    await loadQuotes();
  };

  // Delete order (revert to pending, remove deductions and payments)
  const deleteOrder = async (quote: Quote) => {
    const updated = { ...quote, status: 'pending' as const };
    await saveQuote(updated);
    // Remove stock deductions
    await removeDeductions(quote.id);
    // Remove payments
    await supabase.from('quote_payments').delete().eq('quote_id', quote.id).eq('user_id', user!.id);
    // Remove related transactions
    await supabase.from('transactions').delete().eq('reference_id', quote.id).eq('user_id', user!.id);
    toast({ title: '🗑️ Pedido eliminado', description: `${quote.clientName} vuelve a cotización pendiente.` });
    await loadPayments();
    await loadQuotes();
  };

  // Register advance payment
  const registerPayment = async (type: 'advance' | 'full') => {
    if (!paymentQuoteId || !user) return;
    const amount = parseFloat(newPaymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Ingresa un monto válido.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('quote_payments').insert({
      quote_id: paymentQuoteId,
      user_id: user.id,
      amount,
      payment_date: newPaymentDate,
      notes: newPaymentNotes || (type === 'advance' ? 'Anticipo' : 'Pago completo'),
      is_paid: type === 'full',
    });

    if (error) {
      toast({ title: 'Error', description: 'No se pudo registrar el pago.', variant: 'destructive' });
      return;
    }

    // Register in finances
    const category = type === 'advance' ? 'Anticipos' : 'Pagos completos';
    const quote = quotes.find(q => q.id === paymentQuoteId);
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'income',
      amount,
      description: `${category} - ${quote?.clientName || ''} (Folio #${quote?.folio || ''})`,
      category,
      transaction_date: newPaymentDate,
      reference_id: paymentQuoteId,
    });

    toast({ title: '💰 Pago registrado', description: `${currencySymbol}${amount.toFixed(2)} registrado correctamente.` });
    setShowPaymentDialog(false);
    setNewPaymentAmount('');
    setNewPaymentNotes('');
    await loadPayments();
  };

  // Delete payment
  const deletePayment = async (paymentId: string, quoteId: string) => {
    const { error } = await supabase.from('quote_payments').delete().eq('id', paymentId);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el pago.', variant: 'destructive' });
      return;
    }
    // Also delete the related transaction
    await supabase.from('transactions').delete().eq('reference_id', quoteId).eq('user_id', user!.id);
    toast({ title: 'Pago eliminado' });
    await loadPayments();
  };

  // Edit payment
  const startEditPayment = (payment: QuotePayment) => {
    setEditingPayment(payment);
    setNewPaymentAmount(String(payment.amount));
    setNewPaymentDate(payment.payment_date);
    setNewPaymentNotes(payment.notes || '');
    setPaymentQuoteId(payment.quote_id);
    setShowPaymentDialog(true);
  };

  const updatePayment = async () => {
    if (!editingPayment || !user) return;
    const amount = parseFloat(newPaymentAmount);
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Ingresa un monto válido.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('quote_payments').update({
      amount,
      payment_date: newPaymentDate,
      notes: newPaymentNotes || editingPayment.notes,
    }).eq('id', editingPayment.id);

    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el pago.', variant: 'destructive' });
      return;
    }

    // Re-sync transactions for this quote
    await supabase.from('transactions').delete().eq('reference_id', editingPayment.quote_id).eq('user_id', user.id);
    const quote = quotes.find(q => q.id === editingPayment.quote_id);
    const allPayments = [...(payments[editingPayment.quote_id] || [])].map(p =>
      p.id === editingPayment.id ? { ...p, amount, payment_date: newPaymentDate, notes: newPaymentNotes || p.notes } : p
    );
    for (const p of allPayments) {
      const category = p.is_paid ? 'Pagos completos' : 'Anticipos';
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'income',
        amount: p.amount,
        description: `${category} - ${quote?.clientName || ''} (Folio #${quote?.folio || ''})`,
        category,
        transaction_date: p.payment_date,
        reference_id: editingPayment.quote_id,
      });
    }

    toast({ title: '✏️ Pago actualizado', description: `${currencySymbol}${amount.toFixed(2)} actualizado correctamente.` });
    setShowPaymentDialog(false);
    setNewPaymentAmount('');
    setNewPaymentNotes('');
    setEditingPayment(null);
    await loadPayments();
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const calendarDays = useMemo(() => {
    const days = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= days; i++) cells.push(i);
    return cells;
  }, [currentMonth]);

  const getDateKey = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getStatusColor = (quote: Quote) => {
    if (quote.status === 'cancelled') return 'bg-red-500';
    const isPaid = fullyPaidQuotes.has(quote.id);
    if (quote.status === 'delivered' && isPaid) return 'bg-gradient-to-r from-green-500 to-blue-500';
    if (quote.status === 'delivered') return 'bg-blue-500';
    if (isPaid) return 'bg-green-500';
    return 'bg-amber-500';
  };

  const getStatusLabel = (quote: Quote) => {
    if (quote.status === 'cancelled') return 'Cancelado';
    if (quote.status === 'delivered') return 'Entregado';
    if (fullyPaidQuotes.has(quote.id)) return 'Pagado';
    return 'Pedido confirmado';
  };

  if (loading) return null;
  if (!user) { navigate('/auth'); return null; }
  if (!isAdmin && isCancelled) return <CancelledSubscription />;
  if (!isApproved && !isAdmin) return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-4 px-3 sm:px-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Pedido y Agenda</h1>
      </div>

      {/* Convert quote to order - Accordion Selector */}
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Convertir cotización en pedido
          </h2>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowAccordion(!showAccordion)}
          >
            <span className="text-muted-foreground">Selecciona una cotización pendiente...</span>
            {showAccordion ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAccordion && (
            <div className="mt-3 border rounded-lg max-h-64 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-card z-10">
                <Input
                  placeholder="Buscar por cliente, folio o tipo..."
                  value={accordionSearch}
                  onChange={e => setAccordionSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              {pendingQuotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No hay cotizaciones pendientes</p>
              ) : (
                pendingQuotes.map(q => {
                  const costs = calculateCosts(q);
                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between p-3 border-t hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => convertToOrder(q)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {q.folio && <span className="text-xs font-mono text-muted-foreground">#{String(q.folio).padStart(4, '0')}</span>}
                          <span className="font-medium text-sm truncate">{q.clientName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {q.eventType && <span>{q.eventType}</span>}
                          {q.eventDate && <span>• {format(new Date(q.eventDate + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{currencySymbol}{costs.finalPrice.toFixed(2)}</span>
                        <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-200">
                          Pendiente
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda - Calendar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Agenda
          </h2>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
              ←
            </Button>
            <span className="font-medium capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
              →
            </Button>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={i} />;
              const dateKey = getDateKey(day);
              const events = calendarEvents[dateKey] || [];
              const hasEvents = events.length > 0;
              const isSelected = selectedDay && selectedDay.getDate() === day &&
                selectedDay.getMonth() === currentMonth.getMonth() &&
                selectedDay.getFullYear() === currentMonth.getFullYear();

              return hasEvents ? (
                  <Popover key={i}>
                    <PopoverTrigger asChild>
                      <button
                        className={`aspect-square rounded-full flex items-center justify-center text-xs transition-colors ${
                          (() => {
                            const hasDelivered = events.some(e => e.status === 'delivered');
                            const hasPaid = events.some(e => fullyPaidQuotes.has(e.id));
                            const hasCancelled = events.some(e => e.status === 'cancelled');
                            if (hasDelivered && hasPaid) return 'bg-gradient-to-r from-green-500 to-blue-500';
                            if (hasDelivered) return 'bg-blue-500';
                            if (hasCancelled) return 'bg-red-500';
                            if (hasPaid) return 'bg-green-500';
                            return 'bg-amber-500';
                          })()
                        } text-white font-bold ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        {day}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" side="top" align="center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5 px-1">
                        {format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'dd MMM yyyy', { locale: es })}
                      </p>
                      <div className="space-y-0.5">
                        {events.map(ev => {
                          const time = ev.eventDate
                            ? (() => { try { const d = new Date(ev.eventDate); return d.getHours() !== 0 || d.getMinutes() !== 0 ? format(d, 'HH:mm') : null; } catch { return null; } })()
                            : null;
                          const setupTime = ev.setupTime || null;
                          const displayTime = time || setupTime || null;
                          return (
                            <button
                              key={ev.id}
                              onClick={() => {
                                setSelectedDay(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                                setExpandedQuoteId(ev.id);
                                setTimeout(() => {
                                  const el = document.getElementById(`order-${ev.id}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left text-sm hover:bg-muted transition-colors"
                            >
                              <span className="truncate font-medium">{ev.clientName}</span>
                              {displayTime && <span className="text-xs text-muted-foreground ml-2 shrink-0">{displayTime}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button
                    key={i}
                    className="aspect-square rounded-full flex items-center justify-center text-xs transition-colors hover:bg-muted"
                  >
                    {day}
                  </button>
                );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ListFilter className="h-5 w-5 text-primary" />
          Pedidos
        </h2>
      </div>

      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Buscar pedido..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs min-w-[110px] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos los meses</option>
            {availableMonths.map(m => {
              const [y, mo] = m.split('-');
              const label = format(new Date(parseInt(y), parseInt(mo) - 1, 1), 'MMM yyyy', { locale: es });
              return <option key={m} value={m} className="capitalize">{label}</option>;
            })}
          </select>
        </div>
        <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="w-max sm:w-full flex gap-1">
              <TabsTrigger value="all" className="text-xs px-3">Todos</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs px-3">Confirmados</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs px-3">Entregados</TabsTrigger>
              <TabsTrigger value="paid" className="text-xs px-3">Pagados</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs px-3">Cancelados</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Orders list */}
      {filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No hay pedidos</p>
            <p className="text-sm mt-1">Convierte una cotización en pedido usando el selector de arriba.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuotes.map(quote => {
            const costs = calculateCosts(quote);
            const isExpanded = expandedQuoteId === quote.id;
            const quotePayments = payments[quote.id] || [];
            const totalPaid = quotePayments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = costs.finalPrice - totalPaid;

            return (
              <Card
                key={quote.id}
                id={`order-${quote.id}`}
                className="overflow-hidden transition-all rounded-2xl shadow-soft"
              >
                <CardContent className="p-0">
                  {/* Header - Mobile optimized */}
                  <button
                    className="w-full p-3 sm:p-4 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedQuoteId(isExpanded ? null : quote.id)}
                  >
                    {/* Client name + folio */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(quote)}`} />
                        {quote.folio && <span className="text-[10px] font-mono text-muted-foreground">#{String(quote.folio).padStart(4, '0')}</span>}
                        <span className="font-semibold text-sm truncate">{quote.clientName}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                    </div>

                    {/* Event date */}
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                      {quote.eventType && <span>{quote.eventType}</span>}
                      {quote.eventDate && (
                        <span>• {format(new Date(quote.eventDate + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}</span>
                      )}
                    </div>

                    {/* Status badges */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {(() => {
                        const totalPaid = (payments[quote.id] || []).reduce((sum, p) => sum + p.amount, 0);
                        const isDelivered = quote.status === 'delivered';
                        const isCancelled = quote.status === 'cancelled';
                        const isFullyPaid = totalPaid >= costs.finalPrice && costs.finalPrice > 0;

                        if (isCancelled) {
                          return <Badge variant="outline" className="text-[10px]">Cancelado</Badge>;
                        }

                        const badges = [];
                        if (isDelivered) {
                          badges.push(<Badge key="delivered" className="text-[10px] bg-blue-500/20 text-blue-700 border-blue-300 hover:bg-blue-500/30">Entregado</Badge>);
                        } else {
                          badges.push(<Badge key="status" variant="outline" className="text-[10px]">Pedido confirmado</Badge>);
                        }
                        if (isFullyPaid) {
                          badges.push(<Badge key="paid" className="text-[10px] bg-green-500/20 text-green-700 border-green-300 hover:bg-green-500/30">Pagado</Badge>);
                        } else if (isDelivered && totalPaid > 0) {
                          badges.push(<Badge key="partial" className="text-[10px] bg-orange-500/20 text-orange-700 border-orange-300 hover:bg-orange-500/30">Pago parcial</Badge>);
                        } else if (isDelivered && totalPaid === 0) {
                          badges.push(<Badge key="nopay" className="text-[10px] bg-red-500/20 text-red-700 border-red-300 hover:bg-red-500/30">Falta registrar pago</Badge>);
                        } else if (totalPaid > 0) {
                          badges.push(<Badge key="advance" className="text-[10px] bg-yellow-500/20 text-yellow-700 border-yellow-300 hover:bg-yellow-500/30">Anticipo {currencySymbol}{totalPaid.toFixed(2)}</Badge>);
                        } else {
                          badges.push(<Badge key="noadv" className="text-[10px] bg-muted text-muted-foreground border-muted-foreground/20">Sin anticipo</Badge>);
                        }
                        return <>{badges}</>;
                      })()}
                    </div>

                    {/* Money blocks - 3 horizontal compact */}
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-muted/40 rounded-lg py-1.5 px-2 text-center">
                        <p className="text-[9px] text-muted-foreground leading-none mb-0.5">Total</p>
                        <p className="font-bold text-xs text-foreground">{currencySymbol}{costs.finalPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-green-500/10 rounded-lg py-1.5 px-2 text-center">
                        <p className="text-[9px] text-green-700 leading-none mb-0.5">Pagado</p>
                        <p className="font-bold text-xs text-green-600">{currencySymbol}{totalPaid.toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-500/10 rounded-lg py-1.5 px-2 text-center">
                        <p className="text-[9px] text-orange-700 leading-none mb-0.5">Resta</p>
                        <p className={`font-bold text-xs ${remaining <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {currencySymbol}{Math.max(0, remaining).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t p-3 sm:p-4 space-y-3 bg-muted/10">
                      {/* Info */}
                      {quote.clientPhone && (
                        <p className="text-xs text-muted-foreground">📱 {quote.clientPhone}</p>
                      )}
                      {quote.setupTime && (
                        <p className="text-xs text-muted-foreground">🕐 Hora de montaje: {quote.setupTime}</p>
                      )}
                      {quote.notes && (
                        <p className="text-xs text-muted-foreground">📝 {quote.notes}</p>
                      )}

                      {/* Payments history */}
                      {quotePayments.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Historial de pagos</h4>
                          <div className="space-y-1">
                            {quotePayments.map(p => (
                              <div key={p.id} className="flex items-center justify-between text-xs bg-card rounded p-2">
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium">{currencySymbol}{p.amount.toFixed(2)}</span>
                                  <span className="text-muted-foreground ml-2">{format(new Date(p.payment_date + 'T12:00:00'), 'dd/MM/yy')}</span>
                                  {p.notes && <span className="text-muted-foreground ml-1">- {p.notes}</span>}
                                  {p.is_paid && <Badge className="ml-1 text-[9px] bg-green-100 text-green-700">Completo</Badge>}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditPayment(p)}>
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePayment(p.id, quote.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions - 2 rows on mobile */}
                      <div className="space-y-2">
                        {/* Row 1: Register payment */}
                        {(quote.status === 'approved' || quote.status === 'delivered') && !fullyPaidQuotes.has(quote.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                            onClick={() => {
                              setPaymentQuoteId(quote.id);
                              setShowPaymentDialog(true);
                            }}
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Registrar pago
                          </Button>
                        )}
                        {/* Row 2: Delivered + Cancel */}
                        {quote.status === 'approved' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs w-full"
                              onClick={() => markAsDelivered(quote)}
                            >
                              <Truck className="h-3 w-3 mr-1" />
                              Decoración realizada
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs w-full text-amber-700 border-amber-300 hover:bg-amber-50"
                              onClick={() => cancelOrder(quote)}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Cancelar pedido
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => {
        setShowPaymentDialog(open);
        if (!open) {
          setEditingPayment(null);
          setNewPaymentAmount('');
          setNewPaymentNotes('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPayment ? 'Editar pago' : 'Registrar pago'}</DialogTitle>
            <DialogDescription>
              {editingPayment ? 'Modifica los datos del pago.' : 'Ingresa los datos del pago para esta cotización.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editingPayment && paymentQuoteId && (() => {
              const paymentQuote = quotes.find(q => q.id === paymentQuoteId);
              if (!paymentQuote) return null;
              const costs = calculateCosts(paymentQuote);
              const quotePayments = payments[paymentQuoteId] || [];
              const totalPaid = quotePayments.reduce((sum: number, p: any) => sum + p.amount, 0);
              const saldoPendiente = costs.finalPrice - totalPaid;
              return saldoPendiente > 0 ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total del pedido:</span>
                    <span className="font-medium">{currencySymbol}{costs.finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagado acumulado:</span>
                    <span className="font-medium text-green-600">{currencySymbol}{totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Saldo pendiente:</span>
                    <span className="text-amber-600">{currencySymbol}{saldoPendiente.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full mt-2"
                    variant="secondary"
                    onClick={() => {
                      setNewPaymentAmount(saldoPendiente.toFixed(2));
                      setNewPaymentNotes('Saldo pendiente');
                    }}
                  >
                    Usar saldo pendiente ({currencySymbol}{saldoPendiente.toFixed(2)})
                  </Button>
                </div>
              ) : null;
            })()}
            <div>
              <Label>Monto ({currencySymbol})</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newPaymentAmount}
                onChange={e => setNewPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newPaymentDate}
                onChange={e => setNewPaymentDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Nota</Label>
              <Input
                placeholder="Ej: Anticipo, Pago final..."
                value={newPaymentNotes}
                onChange={e => setNewPaymentNotes(e.target.value)}
              />
            </div>
            {editingPayment ? (
              <Button
                className="w-full"
                onClick={updatePayment}
                disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0}
              >
                Guardar cambios
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => registerPayment('advance')}
                  disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0}
                >
                  Anticipo
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => registerPayment('full')}
                  disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0}
                >
                  Pago completo
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
