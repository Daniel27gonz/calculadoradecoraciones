import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Quote, CostSummary } from '@/types/quote';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrencyByCode } from '@/lib/currencies';

export interface QuotePdfData {
  businessName: string;
  logoUrl: string | null;
  quoteDate: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  decorationType: string;
  decorationDescription: string;
  items: Array<{ id: string; description: string; quantity: number; price: number }>;
  additionalServices: Array<{ id: string; description: string; price: number }>;
  depositPercentage: number;
  depositMessage: string;
  thankYouMessage: string;
  customNote: string;
  total: number;
  currencySymbol: string;
  summary: {
    totalMaterials: number;
    totalReusableMaterials: number;
    wastage: number;
    wastagePercentage: number;
    totalLabor: number;
    totalTransport: number;
    totalExtras: number;
    indirectExpenses: number;
    totalCost: number;
    marginPercentage: number;
    finalPrice: number;
  };
}

export function useQuotePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const convertQuoteToTemplateData = (quote: Quote, summary: CostSummary): QuotePdfData => {
    // Convert all quote items to a unified items list
    const items: Array<{ id: string; description: string; quantity: number; price: number }> = [];

    // Materials
    quote.materials.forEach((mat) => {
      items.push({
        id: mat.id,
        description: mat.name,
        quantity: mat.quantity,
        price: mat.costPerUnit * mat.quantity,
      });
    });

    // Balloons
    quote.balloons.forEach((balloon) => {
      items.push({
        id: balloon.id,
        description: balloon.description,
        quantity: balloon.quantity,
        price: balloon.pricePerUnit * balloon.quantity,
      });
    });

    // Extras
    quote.extras.forEach((extra) => {
      items.push({
        id: extra.id,
        description: extra.name,
        quantity: extra.quantity,
        price: extra.pricePerUnit * extra.quantity,
      });
    });

    // Furniture / Reusable materials
    quote.furnitureItems.forEach((item) => {
      items.push({
        id: item.id,
        description: item.name,
        quantity: item.quantity,
        price: item.pricePerUnit * item.quantity,
      });
    });

    // Reusable materials used
    quote.reusableMaterialsUsed.forEach((item) => {
      items.push({
        id: item.id,
        description: item.name,
        quantity: item.quantity,
        price: item.costPerUse * item.quantity,
      });
    });

    // Workers
    quote.workers.forEach((worker) => {
      items.push({
        id: worker.id,
        description: `Mano de obra - ${worker.name}`,
        quantity: 1,
        price: worker.hourlyRate * worker.hours,
      });
    });

    // Transport
    quote.transportItems.forEach((transport) => {
      items.push({
        id: transport.id,
        description: transport.concept || 'Transporte',
        quantity: 1,
        price: (transport.amountIda || 0) + (transport.amountRegreso || 0),
      });
    });

    const additionalServices: Array<{ id: string; description: string; price: number }> = [];

    const currencyCode = profile?.currency || 'USD';
    const currency = getCurrencyByCode(currencyCode);
    const currencySymbol = currency?.symbol || '$';

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
      decorationDescription: quote.decorationDescription || '',
      items: items.length > 0 ? items : [{ id: '1', description: 'Decoración con globos', quantity: 1, price: summary.finalPrice }],
      additionalServices,
      depositPercentage: 50,
      depositMessage: 'Se solicita un anticipo del {percentage}% para confirmar la fecha',
      thankYouMessage: '¡Gracias por confiar en mí para hacer tu evento especial!',
      customNote: quote.notes || '',
      total: summary.finalPrice,
      currencySymbol,
      summary: {
        totalMaterials: summary.totalMaterials,
        totalReusableMaterials: summary.totalReusableMaterials,
        wastage: summary.wastage,
        wastagePercentage: quote.wastagePercentage || 0,
        totalLabor: summary.totalLabor,
        totalTransport: summary.totalTransport,
        totalExtras: summary.totalExtras,
        indirectExpenses: summary.indirectExpenses,
        totalCost: summary.totalCost,
        marginPercentage: quote.marginPercentage || 0,
        finalPrice: summary.finalPrice,
      },
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
