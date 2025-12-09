import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BalloonSection } from '@/components/calculator/BalloonSection';
import { MaterialSection } from '@/components/calculator/MaterialSection';
import { LaborSection } from '@/components/calculator/LaborSection';
import { ExtrasSection } from '@/components/calculator/ExtrasSection';
import { TransportSection } from '@/components/calculator/TransportSection';
import { ToolWearSection } from '@/components/calculator/ToolWearSection';
import { PricingSection } from '@/components/calculator/PricingSection';
import { CurrencySelector } from '@/components/CurrencySelector';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';
import { Quote, TimePhase } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';
import { getCurrencyByCode } from '@/lib/currencies';

const defaultTimePhases: TimePhase[] = [
  { phase: 'planning', hours: 0, rate: 25 },
  { phase: 'preparation', hours: 0, rate: 25 },
  { phase: 'setup', hours: 0, rate: 25 },
  { phase: 'teardown', hours: 0, rate: 25 },
];

const createEmptyQuote = (hourlyRate: number): Quote => ({
  id: crypto.randomUUID(),
  clientName: '',
  eventDate: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  balloons: [],
  materials: [],
  workers: [],
  timePhases: defaultTimePhases.map(p => ({ ...p, rate: hourlyRate })),
  extras: [],
  transportItems: [],
  marginPercentage: 30,
  toolWearPercentage: 7,
  notes: '',
});

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
  const { 
    quotes, 
    saveQuote, 
    calculateCosts, 
    defaultHourlyRate,
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

  const handleGeneratePDF = () => {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pdfContent = `
════════════════════════════════════════════════════════════════
                    COTIZACIÓN DE DECORACIÓN
════════════════════════════════════════════════════════════════

  💜 Calculadora para Decoradoras de Globos

────────────────────────────────────────────────────────────────
                    INFORMACIÓN DEL EVENTO
────────────────────────────────────────────────────────────────

  👤 Cliente:         ${quote.clientName || 'Sin especificar'}
  📅 Fecha evento:    ${quote.eventDate || 'Por definir'}
  🗓️ Fecha cotización: ${currentDate}

════════════════════════════════════════════════════════════════
                    DESGLOSE DE COSTOS
════════════════════════════════════════════════════════════════

────────────────────────────────────────────────────────────────
  🎈 GLOBOS
────────────────────────────────────────────────────────────────
${quote.balloons.length > 0 
  ? quote.balloons.map(b => `  • ${b.description || 'Globo'}\n    ${b.quantity} unidades × ${currencySymbol}${formatCurrency(b.pricePerUnit || 0)} = ${currencySymbol}${formatCurrency((b.pricePerUnit || 0) * (b.quantity || 0))}`).join('\n\n')
  : '  Sin globos agregados'}

  ─────────────────────────────────────────
  Subtotal Globos:                    ${currencySymbol}${formatCurrency(summary.totalBalloons)}

────────────────────────────────────────────────────────────────
  🎀 MATERIALES (No reutilizables)
────────────────────────────────────────────────────────────────
${quote.materials.length > 0
  ? quote.materials.map(m => `  • ${m.name || 'Material'}\n    ${m.quantity} unidades × ${currencySymbol}${formatCurrency(m.costPerUnit || 0)} = ${currencySymbol}${formatCurrency((m.costPerUnit || 0) * (m.quantity || 0))}`).join('\n\n')
  : '  Sin materiales agregados'}

  ─────────────────────────────────────────
  Subtotal Materiales:                ${currencySymbol}${formatCurrency(summary.totalMaterials)}

────────────────────────────────────────────────────────────────
  👩‍🎨 MANO DE OBRA
────────────────────────────────────────────────────────────────
${quote.timePhases.filter(t => t.hours > 0).map(t => {
  const phaseNames: Record<string, string> = {
    planning: 'Planificación',
    preparation: 'Preparación',
    setup: 'Montaje',
    teardown: 'Desmontaje',
  };
  return `  • ${phaseNames[t.phase] || t.phase}: ${t.hours}h × ${currencySymbol}${formatCurrency(t.rate)}/h = ${currencySymbol}${formatCurrency(t.hours * t.rate)}`;
}).join('\n') || '  Sin horas registradas'}

  ─────────────────────────────────────────
  Subtotal Mano de Obra:              ${currencySymbol}${formatCurrency(summary.totalLabor + summary.totalTime)}

────────────────────────────────────────────────────────────────
  🔧 HERRAMIENTAS (Desgaste ${quote.toolWearPercentage}%)
────────────────────────────────────────────────────────────────
  Base de cálculo: Globos + Materiales + Mano de obra
  Porcentaje aplicado: ${quote.toolWearPercentage}%

  ─────────────────────────────────────────
  Desgaste de Herramientas:           ${currencySymbol}${formatCurrency(summary.toolWear)}

────────────────────────────────────────────────────────────────
  🚗 TRANSPORTE / GASOLINA
────────────────────────────────────────────────────────────────
${quote.transportItems.length > 0
  ? quote.transportItems.map(t => `  • ${t.concept || 'Transporte'}: ${currencySymbol}${formatCurrency(t.amount || 0)}`).join('\n')
  : '  Sin gastos de transporte'}

  ─────────────────────────────────────────
  Subtotal Transporte:                ${currencySymbol}${formatCurrency(summary.totalTransport)}

────────────────────────────────────────────────────────────────
  ✨ EXTRAS
────────────────────────────────────────────────────────────────
${quote.extras.length > 0
  ? quote.extras.map(e => `  • ${e.name || 'Extra'}: ${currencySymbol}${formatCurrency(e.cost || 0)}`).join('\n')
  : '  Sin extras'}

  ─────────────────────────────────────────
  Subtotal Extras:                    ${currencySymbol}${formatCurrency(summary.totalExtras)}

════════════════════════════════════════════════════════════════
                         RESUMEN FINAL
════════════════════════════════════════════════════════════════

  📊 COSTO REAL DEL EVENTO:           ${currencySymbol}${formatCurrency(summary.totalCost)}
  
  💰 Margen de ganancia:              ${quote.marginPercentage}%
  📈 Ganancia neta:                   ${currencySymbol}${formatCurrency(summary.netProfit)}

════════════════════════════════════════════════════════════════
       💜 PRECIO FINAL RECOMENDADO:   ${currencySymbol}${formatCurrency(summary.finalPrice)}
════════════════════════════════════════════════════════════════

${quote.notes ? `
────────────────────────────────────────────────────────────────
  📝 NOTAS ADICIONALES
────────────────────────────────────────────────────────────────
  ${quote.notes}
` : ''}

────────────────────────────────────────────────────────────────
  Cotización generada con 💜 Calculadora para Decoradoras
────────────────────────────────────────────────────────────────
    `.trim();

    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion-${quote.clientName?.replace(/\s+/g, '-') || 'nueva'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Cotización generada",
      description: "El archivo ha sido descargado exitosamente",
    });
  };

  const handleShare = async () => {
    const shareText = `💜 Cotización para ${quote.clientName}\n\n💵 Precio final: ${currencySymbol}${formatCurrency(summary.finalPrice)}\n\n📊 Desglose:\n• Globos: ${currencySymbol}${formatCurrency(summary.totalBalloons)}\n• Materiales: ${currencySymbol}${formatCurrency(summary.totalMaterials)}\n• Mano de obra: ${currencySymbol}${formatCurrency(summary.totalLabor + summary.totalTime)}\n• Herramientas (${quote.toolWearPercentage}%): ${currencySymbol}${formatCurrency(summary.toolWear)}\n• Transporte: ${currencySymbol}${formatCurrency(summary.totalTransport)}\n• Extras: ${currencySymbol}${formatCurrency(summary.totalExtras)}\n\n✨ Generado con Calculadora para Decoradoras`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cotización - ${quote.clientName}`,
          text: shareText,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copiado",
        description: "La cotización ha sido copiada al portapapeles",
      });
    }
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
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">
              {editId ? 'Editar Cotización' : 'Nueva Cotización'}
            </h1>
            <Button variant="default" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Guardar
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
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
                <label className="text-sm font-medium">Fecha del evento</label>
                <Input
                  type="date"
                  value={quote.eventDate}
                  onChange={(e) => updateQuote({ eventDate: e.target.value })}
                />
              </div>
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
        <BalloonSection
          balloons={quote.balloons}
          onChange={(balloons) => updateQuote({ balloons })}
          currencySymbol={currencySymbol}
        />

        <MaterialSection
          materials={quote.materials}
          onChange={(materials) => updateQuote({ materials })}
          currencySymbol={currencySymbol}
        />

        <LaborSection
          workers={quote.workers}
          timePhases={quote.timePhases}
          onWorkersChange={(workers) => updateQuote({ workers })}
          onTimePhasesChange={(timePhases) => updateQuote({ timePhases })}
        />

        {/* Tool Wear Section - after Labor */}
        <ToolWearSection
          totalBalloons={summary.totalBalloons}
          totalMaterials={summary.totalMaterials}
          totalLabor={summary.totalLabor + summary.totalTime}
          toolWearPercentage={quote.toolWearPercentage}
          onPercentageChange={(toolWearPercentage) => updateQuote({ toolWearPercentage })}
          currencySymbol={currencySymbol}
        />

        <ExtrasSection
          extras={quote.extras}
          onChange={(extras) => updateQuote({ extras })}
        />

        <TransportSection
          transportItems={quote.transportItems}
          onChange={(transportItems) => updateQuote({ transportItems })}
        />

        {/* Pricing */}
        <PricingSection
          summary={summary}
          marginPercentage={quote.marginPercentage}
          onMarginChange={(marginPercentage) => updateQuote({ marginPercentage })}
          currencySymbol={currencySymbol}
          toolWearPercentage={quote.toolWearPercentage}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="gradient" size="lg" className="flex-1" onClick={handleSave}>
            <Save className="w-5 h-5" />
            Guardar Cotización
          </Button>
          <Button variant="outline" size="lg" className="flex-1" onClick={handleGeneratePDF}>
            <FileText className="w-5 h-5" />
            Generar PDF
          </Button>
          <Button variant="outline" size="lg" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
            Compartir
          </Button>
        </div>
      </main>
    </div>
  );
}
