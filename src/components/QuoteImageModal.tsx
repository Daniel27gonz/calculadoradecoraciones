import { useState, useRef, useEffect } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QuoteImageGenerator } from './QuoteImageGenerator';
import { useQuoteImage } from '@/hooks/useQuoteImage';
import { Quote, CostSummary } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { profile } = useAuth();
  const imageRef = useRef<HTMLDivElement>(null);
  const { generateImage, shareImage, downloadImage } = useQuoteImage();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    if (open) {
      // Reset states when modal opens
      setImageBlob(null);
      setImageUrl(null);
      setHasError(false);
      setIsGenerating(true);
      setIsDownloading(false);

      // Longer delay to ensure DOM is fully rendered
      const timer = setTimeout(async () => {
        try {
          if (imageRef.current) {
            console.log('Generating image from element:', imageRef.current);
            const blob = await generateImage(imageRef.current);
            console.log('Generated blob:', blob);
            if (blob) {
              setImageBlob(blob);
              setImageUrl(URL.createObjectURL(blob));
            } else {
              setHasError(true);
            }
          } else {
            console.error('imageRef.current is null');
            setHasError(true);
          }
        } catch (error) {
          console.error('Error generating image:', error);
          setHasError(true);
        }
        setIsGenerating(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [open, generateImage, quote, summary]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleDownload = async () => {
    if (!imageBlob) {
      console.log('Error en la descarga: No hay imagen disponible');
      toast({
        title: 'Error',
        description: 'No hay imagen disponible para descargar',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);
    console.log('Descarga iniciada');

    // First attempt
    try {
      downloadImage(imageBlob, quote.clientName || 'cotizacion');
      console.log('Descarga completada');
      toast({
        title: 'Imagen descargada',
        description: 'La cotización ha sido guardada como imagen',
      });
      setIsDownloading(false);
      return;
    } catch (error) {
      console.log('Error en la descarga - primer intento:', error);
    }

    // Automatic retry
    console.log('Reintentando descarga...');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      downloadImage(imageBlob, quote.clientName || 'cotizacion');
      console.log('Descarga completada');
      toast({
        title: 'Imagen descargada',
        description: 'La cotización ha sido guardada como imagen',
      });
    } catch (error) {
      console.log('Error en la descarga - segundo intento:', error);
      toast({
        title: 'Error en la descarga',
        description: 'No se pudo descargar la imagen. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
    
    setIsDownloading(false);
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

  const handleRetry = () => {
    setHasError(false);
    setIsGenerating(true);
    setTimeout(async () => {
      try {
        if (imageRef.current) {
          const blob = await generateImage(imageRef.current);
          if (blob) {
            setImageBlob(blob);
            setImageUrl(URL.createObjectURL(blob));
          } else {
            setHasError(true);
          }
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Error generating image:', error);
        setHasError(true);
      }
      setIsGenerating(false);
    }, 500);
  };

  const getDownloadButtonText = () => {
    if (isDownloading) return 'Descargando...';
    return 'Descargar';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            Cotización en Imagen
          </DialogTitle>
          <DialogDescription>
            Vista previa de la cotización para compartir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generator component - visible but scrolled out of view */}
          <div 
            style={{ 
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              visibility: 'visible',
            }}
            aria-hidden="true"
          >
            <QuoteImageGenerator
              ref={imageRef}
              quote={quote}
              summary={summary}
              currencySymbol={currencySymbol}
              marginPercentage={quote.marginPercentage}
              logoUrl={profile?.logo_url}
              businessName={profile?.business_name}
              validUntil={validUntil}
            />
          </div>

          {/* Valid until input */}
          <div className="space-y-1">
            <Label className="text-sm">Válido hasta</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => {
                setValidUntil(e.target.value);
                // Regenerate image after date change
                setIsGenerating(true);
                setTimeout(async () => {
                  try {
                    if (imageRef.current) {
                      const blob = await generateImage(imageRef.current);
                      if (blob) {
                        setImageBlob(blob);
                        setImageUrl(URL.createObjectURL(blob));
                      }
                    }
                  } catch (error) {
                    console.error('Error regenerating image:', error);
                  }
                  setIsGenerating(false);
                }, 300);
              }}
              className="w-full md:w-64"
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
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">Error al generar la imagen</p>
                <Button variant="outline" onClick={handleRetry}>
                  Reintentar
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={handleDownload}
              disabled={!imageBlob || isGenerating || isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {getDownloadButtonText()}
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
