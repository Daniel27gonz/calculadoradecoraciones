import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const tutorials = [
  { id: '1172031849', title: 'Bienvenida al Sistema', description: 'Introducción general a DecoControl' },
  { id: '1172401090', title: 'Materiales de Consumo', description: 'Cómo gestionar tus materiales de consumo' },
  { id: '1172404208', title: 'Materiales Reutilizables', description: 'Cómo administrar materiales reutilizables' },
  { id: '1172405295', title: 'Gastos del Mes', description: 'Registro y control de gastos mensuales' },
  { id: '1172406005', title: 'Cotización', description: 'Cómo crear una cotización paso a paso' },
  { id: '1172413251', title: 'Agendas y Pedidos', description: 'Gestión de agendas y pedidos de clientes' },
  { id: '1172415053', title: 'Cotización en PDF', description: 'Cómo generar y enviar cotizaciones en PDF' },
  { id: '1172419674', title: 'Resumen del Mes', description: 'Visualiza el resumen financiero mensual' },
];

export default function Tutorial() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Tutoriales</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Toca un video para reproducirlo. {tutorials.length} videos disponibles.
        </p>
        <div className="space-y-3">
          {tutorials.map((video, index) => {
            const isOpen = openId === video.id;
            return (
              <Collapsible key={video.id} open={isOpen} onOpenChange={(open) => setOpenId(open ? video.id : null)}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{index + 1}. {video.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{video.description}</p>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-4 pb-4 pt-0">
                      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingTop: '56.25%' }}>
                        <iframe
                          src={`https://player.vimeo.com/video/${video.id}?badge=0&autopause=0&player_id=0&app_id=58479`}
                          className="absolute inset-0 w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          title={video.title}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </main>
    </div>
  );
}
