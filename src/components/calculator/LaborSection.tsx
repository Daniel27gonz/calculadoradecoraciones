import { Plus, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Worker, TimePhase } from '@/types/quote';
import { useQuote } from '@/contexts/QuoteContext';

interface LaborSectionProps {
  workers: Worker[];
  timePhases: TimePhase[];
  onWorkersChange: (workers: Worker[]) => void;
  onTimePhasesChange: (phases: TimePhase[]) => void;
  simplified?: boolean;
}

const phaseLabels: Record<TimePhase['phase'], string> = {
  planning: '📋 Planificación',
  preparation: '🎨 Preparación',
  setup: '🔧 Montaje',
  teardown: '📦 Desmontaje',
};

export function LaborSection({
  workers,
  timePhases,
  onWorkersChange,
  onTimePhasesChange,
  simplified,
}: LaborSectionProps) {
  const { defaultHourlyRate } = useQuote();

  const addWorker = () => {
    onWorkersChange([
      ...workers,
      { id: crypto.randomUUID(), name: '', hourlyRate: defaultHourlyRate, hours: 0 },
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

  const totalWorkers = workers.reduce((sum, w) => sum + w.hourlyRate * w.hours, 0);
  const totalTime = timePhases.reduce((sum, t) => sum + t.rate * t.hours, 0);
  const total = totalWorkers + totalTime;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">👩‍🎨</span>
            Mano de Obra
          </CardTitle>
          <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Time phases */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Tiempo por fase</h4>
          <div className="grid grid-cols-1 gap-2">
            {timePhases.map((phase) => (
              <div
                key={phase.phase}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
              >
                <span className="text-sm flex-1">{phaseLabels[phase.phase]}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={phase.hours}
                    onChange={(e) => updatePhase(phase.phase, { hours: Number(e.target.value) })}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground">hrs</span>
                  {!simplified && (
                    <>
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        min="0"
                        value={phase.rate}
                        onChange={(e) => updatePhase(phase.phase, { rate: Number(e.target.value) })}
                        className="w-16 h-8 text-center"
                      />
                    </>
                  )}
                </div>
                <span className="text-sm font-semibold w-20 text-right text-primary">
                  ${(phase.hours * phase.rate).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Workers */}
        {!simplified && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Ayudantes</h4>
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-4 rounded-xl bg-nude/50 space-y-3 animate-fade-in"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <Input
                    value={worker.name}
                    onChange={(e) => updateWorker(worker.id, { name: e.target.value })}
                    placeholder="Nombre"
                    className="flex-1 border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeWorker(worker.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">$/hora</label>
                    <Input
                      type="number"
                      min="0"
                      value={worker.hourlyRate}
                      onChange={(e) => updateWorker(worker.id, { hourlyRate: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Horas</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={worker.hours}
                      onChange={(e) => updateWorker(worker.id, { hours: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Total</label>
                    <div className="h-9 flex items-center justify-end font-semibold text-primary">
                      ${(worker.hourlyRate * worker.hours).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="secondary" className="w-full" onClick={addWorker}>
              <Plus className="w-4 h-4" />
              Agregar ayudante
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
