import { useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';

export function useQuoteImage() {
  const cloneRef = useRef<HTMLElement | null>(null);

  const cleanupClone = useCallback(() => {
    if (cloneRef.current && cloneRef.current.parentNode) {
      try {
        cloneRef.current.parentNode.removeChild(cloneRef.current);
      } catch (e) {
        // Ignore if already removed
      }
      cloneRef.current = null;
    }
  }, []);

  const generateImage = useCallback(async (element: HTMLElement): Promise<Blob | null> => {
    // Clean up any existing clone first
    cleanupClone();

    try {
      // Clone the element to make it visible for capture
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.zIndex = '99999';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      clone.setAttribute('data-quote-clone', 'true');
      
      cloneRef.current = clone;
      document.body.appendChild(clone);

      // Wait a bit for fonts and styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if clone was removed (modal closed)
      if (!cloneRef.current || !cloneRef.current.parentNode) {
        return null;
      }

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        width: clone.offsetWidth,
        height: clone.offsetHeight,
      });

      // Always clean up the clone
      cleanupClone();

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      // Always clean up on error
      cleanupClone();
      return null;
    }
  }, [cleanupClone]);

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

  return { generateImage, shareImage, downloadImage, cleanupClone };
}
