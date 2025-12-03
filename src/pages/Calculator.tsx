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
import { PricingSection } from '@/components/calculator/PricingSection';
import { useQuote } from '@/contexts/QuoteContext';
import { Quote, TimePhase } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';

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
  marginPercentage: 30,
  notes: '',
});

export default function Calculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    quotes, 
    saveQuote, 
    calculateCosts, 
    mode, 
    defaultHourlyRate,
    packages 
  } = useQuote();

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
          type: 'latex',
          size: '12"',
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
  const isSimplified = mode === 'beginner';

  const handleSave = () => {
    if (!quote.clientName.trim()) {
      toast({
        title: "Falta información",
        description: "Por favor ingresa el nombre del cliente",
        variant: "destructive",
      });
      return;
    }

    saveQuote(quote);
    toast({
      title: "¡Guardado!",
      description: "Tu cotización ha sido guardada exitosamente",
    });
    navigate('/history');
  };

  const updateQuote = (updates: Partial<Quote>) => {
    setQuote(prev => ({ ...prev, ...updates }));
  };

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
            {!isSimplified && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={quote.notes}
                  onChange={(e) => updateQuote({ notes: e.target.value })}
                  placeholder="Detalles adicionales del evento..."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Sections */}
        <BalloonSection
          balloons={quote.balloons}
          onChange={(balloons) => updateQuote({ balloons })}
          simplified={isSimplified}
        />

        <MaterialSection
          materials={quote.materials}
          onChange={(materials) => updateQuote({ materials })}
        />

        <LaborSection
          workers={quote.workers}
          timePhases={quote.timePhases}
          onWorkersChange={(workers) => updateQuote({ workers })}
          onTimePhasesChange={(timePhases) => updateQuote({ timePhases })}
          simplified={isSimplified}
        />

        {!isSimplified && (
          <ExtrasSection
            extras={quote.extras}
            onChange={(extras) => updateQuote({ extras })}
          />
        )}

        {/* Pricing */}
        <PricingSection
          summary={summary}
          marginPercentage={quote.marginPercentage}
          onMarginChange={(marginPercentage) => updateQuote({ marginPercentage })}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="gradient" size="lg" className="flex-1" onClick={handleSave}>
            <Save className="w-5 h-5" />
            Guardar Cotización
          </Button>
          <Button variant="outline" size="lg" className="flex-1" disabled>
            <FileText className="w-5 h-5" />
            Generar PDF
          </Button>
          <Button variant="outline" size="lg" disabled>
            <Share2 className="w-5 h-5" />
            Compartir
          </Button>
        </div>
      </main>
    </div>
  );
}
