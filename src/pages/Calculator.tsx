import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Image, Share2 } from 'lucide-react';
import { QuoteImageModal } from '@/components/QuoteImageModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { MaterialSection } from '@/components/calculator/MaterialSection';
import { ReusableMaterialsSection } from '@/components/calculator/ReusableMaterialsSection';
import { LaborSection } from '@/components/calculator/LaborSection';
import { ExtrasSection } from '@/components/calculator/ExtrasSection';
import { TransportSection } from '@/components/calculator/TransportSection';

import { WastageSection } from '@/components/calculator/WastageSection';
import { PricingSection } from '@/components/calculator/PricingSection';
import { CurrencySelector } from '@/components/CurrencySelector';
import { LogoUploadSection } from '@/components/calculator/LogoUploadSection';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { PendingApproval } from '@/components/PendingApproval';
import { Quote, TimePhase } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';

const defaultTimePhases: TimePhase[] = [
  { phase: 'planning', hours: undefined as unknown as number, rate: 25 },
  { phase: 'preparation', hours: undefined as unknown as number, rate: 25 },
  { phase: 'setup', hours: undefined as unknown as number, rate: 25 },
  { phase: 'teardown', hours: undefined as unknown as number, rate: 25 },
];

const createEmptyQuote = (hourlyRate: number): Quote => ({
  id: crypto.randomUUID(),
  clientName: '',
  clientPhone: '',
  eventDate: '',
  setupTime: '',
  eventType: '',
  decorationDescription: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  balloons: [],
  materials: [],
  workers: [],
  timePhases: defaultTimePhases.map(p => ({ ...p, rate: hourlyRate })),
  extras: [],
  furnitureItems: [],
  transportItems: [],
  indirectExpenses: [],
  reusableMaterialsUsed: [],
  marginPercentage: 30,
  toolWearPercentage: 7,
  wastagePercentage: 5,
  notes: '',
  status: 'pending',
});

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile, updateProfile, isApproved, approvalStatus, isAdmin } = useAuth();
  const {
    quotes, 
    saveQuote, 
    calculateCosts, 
    defaultHourlyRate,
    setDefaultHourlyRate,
    packages 
  } = useQuote();

  const [currency, setCurrency] = useState(profile?.currency || 'USD');
  const currencyInfo = getCurrencyByCode(currency);
  const currencySymbol = currencyInfo?.symbol || '$';

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Sync currency with profile
  useEffect(() => {
    if (profile?.currency) {
      setCurrency(profile.currency);
    }
  }, [profile]);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    if (profile) {
      updateProfile({ currency: newCurrency });
    }
  };

  const editId = searchParams.get('edit');
  const packageId = searchParams.get('package');

  const [quote, setQuote] = useState<Quote>(() => {
    if (editId) {
      const existing = quotes.find(q => q.id === editId);
      if (existing) return existing;
    }
    
    const newQuote = createEmptyQuote(defaultHourlyRate);
    
    if (packageId) {
      const pkg = packages.find(p => p.id === packageId);
      if (pkg) {
        newQuote.balloons = [{
          id: crypto.randomUUID(),
          description: `Globos para ${pkg.name}`,
          pricePerUnit: 0.5,
          quantity: pkg.estimatedBalloons,
        }];
        newQuote.materials = pkg.estimatedMaterials.map(m => ({
          ...m,
          id: crypto.randomUUID(),
        }));
        newQuote.timePhases = newQuote.timePhases.map(p => 
          p.phase === 'setup' ? { ...p, hours: pkg.estimatedHours } : p
        );
      }
    }
    
    return newQuote;
  });

  // When quotes load asynchronously, update the quote if we're editing
  const hasLoadedEditQuote = useRef(false);
  useEffect(() => {
    if (editId && quotes.length > 0 && !hasLoadedEditQuote.current) {
      const existing = quotes.find(q => q.id === editId);
      if (existing) {
        setQuote(existing);
        hasLoadedEditQuote.current = true;
      }
    }
  }, [editId, quotes]);

  const summary = calculateCosts(quote);

  const handleSave = async () => {
    if (!quote.clientName.trim()) {
      toast({
        title: "Falta información",
        description: "Por favor ingresa el nombre del cliente",
        variant: "destructive",
      });
      return;
    }
    if (!quote.eventDate) {
      toast({
        title: "Falta información",
        description: "Por favor ingresa la fecha del evento para poder agregarlo a la agenda",
        variant: "destructive",
      });
      return;
    }

    await saveQuote(quote);
    toast({
      title: "¡Guardado!",
      description: "Tu cotización ha sido guardada exitosamente",
    });
    navigate('/history');
  };

  const updateQuote = (updates: Partial<Quote>) => {
    setQuote(prev => ({ ...prev, ...updates }));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [showImageModal, setShowImageModal] = useState(false);

  const handleOpenImageModal = () => {
    setShowImageModal(true);
  };

  if (!user) {
    return null;
  }

  // Block non-approved users (admins bypass)
  if (!isAdmin && approvalStatus && !isApproved) {
    return <PendingApproval status={approvalStatus as 'pending' | 'rejected'} />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="shrink-0 px-2 sm:px-3">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
            <h1 className="font-display text-base sm:text-xl font-semibold truncate text-center">
              {editId ? 'Editar Cotización' : 'Nueva Cotización'}
            </h1>
            <Button variant="default" size="sm" onClick={handleSave} className="shrink-0 px-2 sm:px-3">
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 sm:px-4 py-6 space-y-6 overflow-x-hidden">
        {/* Logo Upload */}
        <LogoUploadSection />

        {/* Currency Selector */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💱</span>
              Moneda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencySelector value={currency} onChange={handleCurrencyChange} />
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              Información del Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del cliente *</label>
                <Input
                  value={quote.clientName}
                  onChange={(e) => updateQuote({ clientName: e.target.value })}
                  placeholder="Ej: María García"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono del cliente</label>
                <Input
                  value={quote.clientPhone}
                  onChange={(e) => updateQuote({ clientPhone: e.target.value })}
                  placeholder="Ej: +52 555 123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha del evento <span className="text-destructive">*</span></label>
                <Input
                  type="date"
                  value={quote.eventDate}
                  onChange={(e) => updateQuote({ eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora del montaje</label>
                <Input
                  type="time"
                  value={quote.setupTime}
                  onChange={(e) => updateQuote({ setupTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de decoración</label>
                <Input
                  value={quote.eventType}
                  onChange={(e) => updateQuote({ eventType: e.target.value })}
                  placeholder="Ej: Cumpleaños infantil, Boda, XV años"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción completa de la decoración</label>
              <Textarea
                value={quote.decorationDescription}
                onChange={(e) => updateQuote({ decorationDescription: e.target.value })}
                placeholder="Describe los elementos, colores, temática y detalles de la decoración..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                value={quote.notes}
                onChange={(e) => updateQuote({ notes: e.target.value })}
                placeholder="Detalles adicionales del evento..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cost Sections */}

        <MaterialSection
          materials={quote.materials}
          onChange={(materials) => updateQuote({ materials })}
          currencySymbol={currencySymbol}
        />

        <ReusableMaterialsSection
          reusableMaterialsUsed={quote.reusableMaterialsUsed}
          onChange={(reusableMaterialsUsed) => updateQuote({ reusableMaterialsUsed })}
          currencySymbol={currencySymbol}
        />

        {/* Hourly Rate */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Tarifa por hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-2xl text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                min="0"
                value={defaultHourlyRate ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : Number(e.target.value);
                  setDefaultHourlyRate(value);
                  if (profile) {
                    updateProfile({ default_hourly_rate: value });
                  }
                }}
                placeholder="0"
                className="text-2xl font-bold h-14 w-32"
              />
              <span className="text-muted-foreground">por hora</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Se aplicará como tarifa predeterminada en las fases de tiempo.
            </p>
          </CardContent>
        </Card>

        <LaborSection
          workers={quote.workers}
          timePhases={quote.timePhases}
          onWorkersChange={(workers) => updateQuote({ workers })}
          onTimePhasesChange={(timePhases) => updateQuote({ timePhases })}
          currencySymbol={currencySymbol}
        />


        <ExtrasSection
          extras={quote.extras}
          onChange={(extras) => updateQuote({ extras })}
          currencySymbol={currencySymbol}
        />

        <TransportSection
          transportItems={quote.transportItems}
          onChange={(transportItems) => updateQuote({ transportItems })}
          currencySymbol={currencySymbol}
        />


        <WastageSection
          totalMaterials={summary.totalMaterials}
          wastagePercentage={quote.wastagePercentage}
          onPercentageChange={(wastagePercentage) => updateQuote({ wastagePercentage })}
          currencySymbol={currencySymbol}
        />

        {/* Pricing */}
        <PricingSection
          summary={summary}
          marginPercentage={quote.marginPercentage}
          toolWearPercentage={quote.toolWearPercentage}
          wastagePercentage={quote.wastagePercentage}
          onMarginChange={(marginPercentage) => updateQuote({ marginPercentage })}
          currencySymbol={currencySymbol}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="gradient" size="lg" className="flex-1" onClick={handleSave}>
            <Save className="w-5 h-5" />
            Guardar Cotización
          </Button>
          <Button variant="outline" size="lg" className="flex-1" onClick={handleOpenImageModal}>
            <Image className="w-5 h-5" />
            Ver / Compartir Imagen
          </Button>
        </div>

        {/* Quote Image Modal */}
        <QuoteImageModal
          open={showImageModal}
          onOpenChange={setShowImageModal}
          quote={quote}
          summary={summary}
          currencySymbol={currencySymbol}
        />
      </main>
    </div>
  );
}
