import { useState, useRef, useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QuoteImageGenerator } from './QuoteImageGenerator';
import { useQuoteImage } from '@/hooks/useQuoteImage';
import { Quote, CostSummary } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';

interface QuoteImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  summary: CostSummary;
  currencySymbol: string;
}

export function QuoteImageModal({
  open,
  onOpenChange,
  quote,
  summary,
  currencySymbol,
}: QuoteImageModalProps) {
  const { toast } = useToast();
  const imageRef = useRef<HTMLDivElement>(null);
  const { generateImage, shareImage, downloadImage } = useQuoteImage();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && imageRef.current) {
      setIsGenerating(true);
      // Small delay to ensure the component is rendered
      setTimeout(async () => {
        if (imageRef.current) {
          const blob = await generateImage(imageRef.current);
          if (blob) {
            setImageBlob(blob);
            setImageUrl(URL.createObjectURL(blob));
          }
        }
        setIsGenerating(false);
      }, 100);
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [open, generateImage]);

  const handleDownload = () => {
    if (imageBlob) {
      downloadImage(imageBlob, quote.clientName || 'cotizacion');
      toast({
        title: 'Imagen descargada',
        description: 'La cotización ha sido guardada como imagen',
      });
    }
  };

  const handleShare = async () => {
    if (imageBlob) {
      const result = await shareImage(imageBlob, quote.clientName || 'cotizacion');
      if (result.success) {
        if (result.method === 'download') {
          toast({
            title: 'Imagen descargada',
            description: 'Tu dispositivo no soporta compartir directamente. La imagen ha sido descargada.',
          });
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            Cotización en Imagen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden generator component - must be visible for html2canvas */}
          <div style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            opacity: 0, 
            pointerEvents: 'none',
            zIndex: -1,
          }}>
            <QuoteImageGenerator
              ref={imageRef}
              quote={quote}
              summary={summary}
              currencySymbol={currencySymbol}
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden bg-muted flex items-center justify-center min-h-[300px]">
            {isGenerating ? (
              <div className="text-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Generando imagen...</p>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Cotización"
                className="max-w-full h-auto"
              />
            ) : (
              <p className="text-muted-foreground">Error al generar la imagen</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleDownload}
              disabled={!imageBlob || isGenerating}
            >
              <Download className="w-5 h-5" />
              Descargar
            </Button>
            <Button
              variant="gradient"
              size="lg"
              className="flex-1"
              onClick={handleShare}
              disabled={!imageBlob || isGenerating}
            >
              <Share2 className="w-5 h-5" />
              Compartir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
