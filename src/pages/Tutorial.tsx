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
          <CardContent className="p-4 md:p-6">
            <h3 className="font-display text-lg font-semibold mb-3">🎬 Bienvenida al Sistema</h3>
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                src="https://player.vimeo.com/video/1172031849?badge=0&autopause=0&player_id=0&app_id=58479"
                className="absolute inset-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Bienvenida Sistema"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
