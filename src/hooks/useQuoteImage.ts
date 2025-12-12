import { useCallback } from 'react';
import html2canvas from 'html2canvas';

export function useQuoteImage() {
  const generateImage = useCallback(async (element: HTMLElement): Promise<Blob | null> => {
    try {
      // Clone the element to make it visible for capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.zIndex = '99999';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      document.body.appendChild(clone);

      // Wait a bit for fonts and styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
      });

      // Remove the clone
      document.body.removeChild(clone);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  }, []);

  const shareImage = useCallback(async (blob: Blob, clientName: string) => {
    const file = new File([blob], `cotizacion-${clientName.replace(/\s+/g, '-')}.png`, {
      type: 'image/png',
    });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Cotización - ${clientName}`,
          text: `💜 Cotización para ${clientName}`,
        });
        return { success: true, method: 'share' };
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
        return { success: false, method: 'share' };
      }
    } else {
      // Fallback: Download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${clientName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, method: 'download' };
    }
  }, []);

  const downloadImage = useCallback((blob: Blob, clientName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion-${clientName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  return { generateImage, shareImage, downloadImage };
}
