import { useEffect, useRef } from 'react';
import { Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumericField } from '@/components/ui/numeric-field';
import { Worker, TimePhase } from '@/types/quote';
import { useQuote } from '@/contexts/QuoteContext';
import { useAuth } from '@/contexts/AuthContext';

interface LaborSectionProps {
  workers: Worker[];
  timePhases: TimePhase[];
  onWorkersChange: (workers: Worker[]) => void;
  onTimePhasesChange: (phases: TimePhase[]) => void;
  currencySymbol?: string;
}

const phaseLabels: Record<TimePhase['phase'], { label: string; icon: string }> = {
  planning: { label: 'Planificación', icon: '📋' },
  preparation: { label: 'Preparación', icon: '🎨' },
  setup: { label: 'Montaje', icon: '🔧' },
  teardown: { label: 'Desmontaje', icon: '📦' },
};

export function LaborSection({
  workers,
  timePhases,
  onWorkersChange,
  onTimePhasesChange,
  currencySymbol = '$',
}: LaborSectionProps) {
  const { defaultHourlyRate, setDefaultHourlyRate } = useQuote();
  const { profile, updateProfile } = useAuth();
  const prevRateRef = useRef(defaultHourlyRate);

  // Auto-fill time phase rates when defaultHourlyRate changes
  useEffect(() => {
    if (defaultHourlyRate !== prevRateRef.current && defaultHourlyRate > 0) {
      const updated = timePhases.map(p => ({
        ...p,
        rate: (p.rate === 0 || p.rate === prevRateRef.current) ? defaultHourlyRate : p.rate,
      }));
      onTimePhasesChange(updated);
      prevRateRef.current = defaultHourlyRate;
    }
  }, [defaultHourlyRate]);

  const addWorker = () => {
    onWorkersChange([
      ...workers,
      { id: crypto.randomUUID(), name: '', hourlyRate: defaultHourlyRate, hours: undefined as unknown as number },
    ]);
  };

  const updateWorker = (id: string, updates: Partial<Worker>) => {
    onWorkersChange(workers.map(w => (w.id === id ? { ...w, ...updates } : w)));
  };

  const removeWorker = (id: string) => {
    onWorkersChange(workers.filter(w => w.id !== id));
  };

  const updatePhase = (phase: TimePhase['phase'], updates: Partial<TimePhase>) => {
    onTimePhasesChange(
      timePhases.map(t => (t.phase === phase ? { ...t, ...updates } : t))
    );
  };

  const totalWorkers = workers.reduce((sum, w) => sum + (w.hourlyRate || 0) * (w.hours || 0), 0);
  const totalTime = timePhases.reduce((sum, t) => sum + (t.rate || 0) * (t.hours || 0), 0);
  const total = totalWorkers + totalTime;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <span className="text-xl sm:text-2xl">👩‍🎨</span>
            <span>Mano de Obra</span>
          </CardTitle>
          <div className="px-3 py-1.5 rounded-full bg-nude/80 border border-primary/20">
            <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
              {currencySymbol}{formatCurrency(total)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time phases */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Tiempo por fase
          </h4>
          <div className="space-y-2">
            {timePhases.map((phase) => (
              <div
                key={phase.phase}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50"
              >
                {/* Phase label */}
                <div className="flex items-center gap-2 sm:min-w-[130px]">
                  <span className="text-base">{phaseLabels[phase.phase].icon}</span>
                  <span className="text-sm font-medium">{phaseLabels[phase.phase].label}</span>
                </div>
                
                {/* Inputs row */}
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="flex-1 min-w-[60px] max-w-[90px]">
                    <NumericField
                      min={0}
                      step={0.5}
                      value={phase.hours ?? ''}
                      onChange={(e) => updatePhase(phase.phase, { hours: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      suffix="hrs"
                      className="h-10 text-sm"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm">×</span>
                  <div className="flex-1 min-w-[60px] max-w-[90px]">
                    <NumericField
                      min={0}
                      prefix={currencySymbol}
                      value={phase.rate ?? ''}
                      onChange={(e) => updatePhase(phase.phase, { rate: e.target.value === '' ? 0 : Number(e.target.value) })}
                      placeholder="0"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
                
                {/* Subtotal */}
                <div className="flex items-center justify-end sm:min-w-[90px]">
                  <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
                    {currencySymbol}{formatCurrency((phase.hours || 0) * (phase.rate || 0))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workers */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Ayudantes
          </h4>
          
          {workers.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm bg-muted/30 rounded-lg">
              No hay ayudantes agregados
            </div>
          )}

          {workers.map((worker) => (
            <div
              key={worker.id}
              className="p-4 rounded-xl bg-nude/50 border border-primary/10 space-y-4 animate-fade-in"
            >
              {/* Worker name */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <Input
                  value={worker.name}
                  onChange={(e) => updateWorker(worker.id, { name: e.target.value })}
                  placeholder="Nombre del ayudante"
                  className="flex-1 h-10 text-base border-dashed"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorker(worker.id)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Worker fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <NumericField
                  label="$/hora"
                  prefix={currencySymbol}
                  min={0}
                  value={worker.hourlyRate ?? ''}
                  onChange={(e) => updateWorker(worker.id, { hourlyRate: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="0"
                />
                <NumericField
                  label="Horas"
                  min={0}
                  step={0.5}
                  value={worker.hours ?? ''}
                  onChange={(e) => updateWorker(worker.id, { hours: e.target.value === '' ? 0 : Number(e.target.value) })}
                  placeholder="0"
                />
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground leading-none">Total</label>
                  <div className="h-11 flex items-center justify-end px-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="font-bold text-primary tabular-nums">
                      {currencySymbol}{formatCurrency((worker.hourlyRate || 0) * (worker.hours || 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button variant="secondary" className="w-full h-12 text-base font-medium" onClick={addWorker}>
            <Plus className="w-5 h-5 mr-2" />
            Agregar ayudante
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
