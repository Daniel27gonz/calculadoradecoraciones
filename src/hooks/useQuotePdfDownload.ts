import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Quote, CostSummary } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface QuotePdfData {
  businessName: string;
  logoUrl: string | null;
  quoteDate: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  decorationType: string;
  items: Array<{ id: string; description: string; quantity: number; price: number }>;
  additionalServices: Array<{ id: string; description: string; price: number }>;
  depositPercentage: number;
  depositMessage: string;
  thankYouMessage: string;
  customNote: string;
  total: number;
}

export function useQuotePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const convertQuoteToTemplateData = (quote: Quote, summary: CostSummary): QuotePdfData => {
    // Convert materials to items format
    const items = quote.materials.map((mat) => ({
      id: mat.id,
      description: mat.name,
      quantity: mat.quantity,
      price: mat.costPerUnit * mat.quantity,
    }));

    // Add balloons as items
    quote.balloons.forEach((balloon) => {
      items.push({
        id: balloon.id,
        description: balloon.description,
        quantity: balloon.quantity,
        price: balloon.pricePerUnit * balloon.quantity,
      });
    });

    // Convert extras to additional services
    const additionalServices = quote.extras.map((extra) => ({
      id: extra.id,
      description: extra.name,
      price: extra.pricePerUnit * extra.quantity,
    }));

    // Add transport as additional service if any
    quote.transportItems.forEach((transport) => {
      additionalServices.push({
        id: transport.id,
        description: transport.concept || 'Compra del material',
        price: (transport.amountIda || 0) + (transport.amountRegreso || 0),
      });
    });

    return {
      businessName: profile?.business_name || 'Mi Negocio',
      logoUrl: profile?.logo_url || null,
      quoteDate: format(new Date(quote.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es }),
      clientName: quote.clientName,
      clientPhone: '',
      eventDate: quote.eventDate 
        ? format(new Date(quote.eventDate), "d 'de' MMMM 'de' yyyy", { locale: es })
        : '',
      eventLocation: '',
      decorationType: '',
      items: items.length > 0 ? items : [{ id: '1', description: 'Decoración con globos', quantity: 1, price: summary.finalPrice }],
      additionalServices,
      depositPercentage: 50,
      depositMessage: 'Se solicita un anticipo del {percentage}% para confirmar la fecha',
      thankYouMessage: '¡Gracias por confiar en mí para hacer tu evento especial!',
      customNote: quote.notes || '',
      total: summary.finalPrice,
    };
  };

  const downloadPdf = async (
    elementRef: React.RefObject<HTMLDivElement>,
    fileName: string
  ): Promise<boolean> => {
    if (!elementRef.current) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF',
        variant: 'destructive',
      });
      return false;
    }

    setIsGenerating(true);

    try {
      // Clone the element to avoid modifying the original
      const clone = elementRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '9999';
      clone.style.background = 'white';
      clone.style.width = '800px';
      clone.style.visibility = 'visible';
      document.body.appendChild(clone);

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Remove clone
      document.body.removeChild(clone);

      // Convert to image and download
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: '¡Descargado!',
        description: 'La cotización se ha descargado correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar la cotización',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    convertQuoteToTemplateData,
    downloadPdf,
  };
}
