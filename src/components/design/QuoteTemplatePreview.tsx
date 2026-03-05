import { useRef, useState } from "react";
import { QuoteTemplateData } from "@/pages/Design";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";

interface QuoteTemplatePreviewProps {
  data: QuoteTemplateData;
  total: number;
}


const QuoteTemplatePreview = ({ data, total }: QuoteTemplatePreviewProps) => {
  const depositAmount = (total * data.depositPercentage) / 100;
  const templateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cs = data.currencySymbol || '$';
  const s = data.costSummary;

  const fmt = (amount: number) =>
    `${cs}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleDownload = async () => {
    if (!templateRef.current) return;

    setIsDownloading(true);

    try {
      const clone = templateRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.zIndex = "9999";
      clone.style.background = "white";
      clone.style.width = "800px";
      clone.style.visibility = "visible";
      document.body.appendChild(clone);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(clone);

      const clientName = data.clientName || "cotizacion";
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "").replace(/\s+/g, "-");
      const fileName = `cotizacion-${sanitizedName}-${new Date().toISOString().split("T")[0]}`;

      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);

      toast({ title: "¡Descargado!", description: "La cotización se ha descargado como PDF" });
    } catch (error) {
      console.error("Error en la descarga:", error);
      toast({ title: "Error", description: "No se pudo descargar la cotización", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Button onClick={handleDownload} disabled={isDownloading} className="gap-2 bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4" />
          {isDownloading ? "Descargando..." : "Descargar PDF"}
        </Button>
      </div>

      <div ref={templateRef} className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
        {/* Header con borde elegante */}
        <div className="relative p-6" style={{ 
          background: 'linear-gradient(135deg, #fdf8f5, #fdf2f8, #fdf8f5)',
          borderBottom: '2px solid #d4a574'
        }}>
          {/* Borde decorativo interior */}
          <div style={{ 
            position: 'absolute', 
            top: '8px', left: '8px', right: '8px', bottom: '8px',
            border: '1px solid #e8c9a8',
            pointerEvents: 'none'
          }} />

          <div className="flex items-start justify-between relative" style={{ zIndex: 1 }}>
            {/* Logo y nombre del negocio - centrado */}
            <div className="flex flex-col items-center" style={{ flex: '1 1 50%' }}>
              <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden mb-2" style={{ background: data.businessLogo ? 'transparent' : 'linear-gradient(to bottom right, #fbcfe8, #fce7f3)' }}>
                {data.businessLogo ? (
                  <img src={data.businessLogo} alt={data.businessName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-4xl">🎈</span>
                )}
              </div>
              <span className="text-lg font-semibold italic" style={{ color: '#8b6f5e', fontFamily: 'Georgia, serif' }}>{data.businessName}</span>
            </div>

            {/* Datos del cliente al costado derecho */}
            <div className="text-right space-y-1" style={{ flex: '1 1 50%', paddingTop: '12px' }}>
              <p className="text-base font-bold" style={{ color: '#4a3728' }}>{data.clientName || '___'}</p>
              {data.eventLocation && (
                <p className="text-sm" style={{ color: '#6b5c4f' }}>{data.eventLocation}</p>
              )}
              <p className="text-sm" style={{ color: '#6b5c4f' }}>Fecha: {data.quoteDate}</p>
              {data.validUntil && (
                <p className="text-sm" style={{ color: '#6b5c4f' }}>
                  Válido hasta: {(() => {
                    try {
                      return format(new Date(data.validUntil + 'T12:00:00'), "dd/MM/yyyy", { locale: es });
                    } catch {
                      return data.validUntil;
                    }
                  })()}
                </p>
              )}
              {data.eventDate && (
                <p className="text-sm" style={{ color: '#6b5c4f' }}>
                  Fecha del evento: <strong style={{ color: '#4a3728' }}>{data.eventDate.toUpperCase()}</strong>
                </p>
              )}
              {data.folio && (
                <p className="text-sm font-semibold" style={{ color: '#a0785c' }}>
                  Folio: #{String(data.folio).padStart(4, '0')}
                </p>
              )}
            </div>
          </div>

          {/* Título COTIZACIÓN centrado */}
          <div className="text-center mt-4 relative" style={{ zIndex: 1 }}>
            <h1 className="text-3xl font-bold tracking-widest" style={{ color: '#4a3728', fontFamily: 'Georgia, serif' }}>COTIZACIÓN</h1>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4 bg-white">
          {/* Tabla de servicios cotizados */}
          {data.items && data.items.length > 0 && (
            <div className="border-b border-pink-100 pb-4">
              <h3 className="text-lg font-semibold text-pink-500 mb-3">SERVICIOS COTIZADOS:</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f9a8d4' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: '#db2777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Descripción
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: '#db2777', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #fce7f3', backgroundColor: index % 2 === 0 ? '#ffffff' : '#fdf2f8' }}>
                      <td style={{ padding: '8px 12px', color: '#555', lineHeight: 1.5 }}>
                        {item.description}
                      </td>
                      <td style={{ padding: '8px 12px', color: '#333', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        {item.quantity === 0 ? '—' : item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Precio Final */}
          <div className="flex justify-end items-center gap-4 pt-2 pb-2 px-4 rounded-lg bg-gradient-to-r from-pink-100 to-pink-50">
            <span className="text-xl font-bold text-gray-800">PRECIO FINAL:</span>
            <span className="text-2xl font-bold text-pink-600">
              {s ? fmt(s.finalPrice) : `${cs}${total.toLocaleString()}`}
            </span>
          </div>

          {/* Deposit message */}
          <div className="text-center text-gray-600 py-4">
            {data.depositMessage.replace("{percentage}", data.depositPercentage.toString())}
          </div>



          {/* Custom note */}
          {data.customNote && (
            <div className="text-center italic text-pink-500 text-sm py-2">{data.customNote}</div>
          )}

          {/* Thank you message */}
          <div className="relative bg-gradient-to-r from-pink-50 to-white p-6 text-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
              <Heart className="w-4 h-4 text-pink-300 fill-pink-200" />
              <Heart className="w-3 h-3 text-pink-200 fill-pink-100" />
            </div>
            <p className="text-lg font-medium text-gray-700 italic">"{data.thankYouMessage}"</p>
            <div className="absolute right-4 bottom-2">
              <svg width="40" height="20" viewBox="0 0 40 20" className="text-pink-300">
                <path d="M0 10 Q10 0 20 10 Q30 20 40 10" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplatePreview;
