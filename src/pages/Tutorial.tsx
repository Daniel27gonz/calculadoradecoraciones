import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Tutorial() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 md:pb-8 md:pt-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border md:relative md:bg-transparent md:border-0">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <h1 className="font-display text-xl font-semibold">Tutorial</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="font-display text-xl font-semibold mb-2">
              Próximamente
            </h3>
            <p className="text-muted-foreground">
              Aquí encontrarás guías y tutoriales para aprovechar al máximo DecoControl.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
