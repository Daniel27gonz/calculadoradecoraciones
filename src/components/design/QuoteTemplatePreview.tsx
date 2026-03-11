import { useRef, useState } from "react";
import { QuoteTemplateData, defaultPdfColors } from "@/pages/Design";
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

// Helper to lighten a hex color for backgrounds
const lightenColor = (hex: string, amount: number = 0.85): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.round((num >> 16) + (255 - (num >> 16)) * amount);
  const g = Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount);
  const b = Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount);
  return `rgb(${r}, ${g}, ${b})`;
};

const QuoteTemplatePreview = ({ data, total }: QuoteTemplatePreviewProps) => {
  const depositAmount = (total * data.depositPercentage) / 100;
  const templateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const cs = data.currencySymbol || '$';
  const s = data.costSummary;
  const c = data.pdfColors || defaultPdfColors;

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
      // Letter size: 215.9mm x 279.4mm
      const pdfWidth = 215.9;
      const pdfHeight = 279.4;
      const imgRatio = canvas.width / canvas.height;
      const contentWidth = pdfWidth;
      const contentHeight = contentWidth / imgRatio;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
      });

      if (contentHeight <= pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, contentWidth, contentHeight);
      } else {
        // Content taller than one page: split across pages
        let remainingHeight = contentHeight;
        let yOffset = 0;
        while (remainingHeight > 0) {
          if (yOffset > 0) pdf.addPage("letter", "portrait");
          pdf.addImage(imgData, "PNG", 0, -yOffset, contentWidth, contentHeight);
          yOffset += pdfHeight;
          remainingHeight -= pdfHeight;
        }
      }
      pdf.save(`${fileName}.pdf`);

      toast({ title: "¡Descargado!", description: "La cotización se ha descargado como PDF" });
    } catch (error) {
      console.error("Error en la descarga:", error);
      toast({ title: "Error", description: "No se pudo descargar la cotización", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const headerBgLight = lightenColor(c.header, 0.5);
  const headerBgLighter = lightenColor(c.header, 0.75);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Button onClick={handleDownload} disabled={isDownloading} className="gap-2 bg-primary hover:bg-primary/90">
          <Download className="w-4 h-4" />
          {isDownloading ? "Descargando..." : "Descargar PDF"}
        </Button>
      </div>

      <div ref={templateRef} className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
        {/* Header */}
        <div className="relative p-6" style={{ background: `linear-gradient(to right, ${headerBgLight}, ${headerBgLighter})` }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(to bottom right, ${headerBgLight}, ${lightenColor(c.header, 0.65)})` }}>
              {data.businessLogo ? (
                <img src={data.businessLogo} alt={data.businessName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🎈</span>
              )}
            </div>
            <span className="text-lg font-bold text-center" style={{ color: c.titles }}>{data.businessName}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-widest uppercase">Cotización</h1>
            {data.folio && (
              <p className="text-sm font-semibold" style={{ color: c.titles }}>
                Folio: #{String(data.folio).padStart(4, '0')}
              </p>
            )}
            <div className="text-sm text-gray-600">Fecha: {data.quoteDate}</div>
          </div>
        </div>

        {/* Client data */}
        <div className="p-6 space-y-4 bg-white">
          <div className="pb-4" style={{ borderBottom: `1px solid ${c.lines}` }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: c.titles }}>DATOS DEL CLIENTE:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <span className="text-gray-600">Fecha y lugar del evento:</span>
                <span style={{ color: c.titles, textDecoration: 'underline', textDecorationColor: c.lines }}>
                  {data.eventDate || "___"}, {data.eventLocation || "___"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tema o tipo de decoración:</span>
                <Heart className="w-4 h-4" style={{ color: c.lines }} />
              </div>
              <div className="ml-4" style={{ color: c.titles }}>{data.decorationType || "___"}</div>
              <div className="flex flex-wrap gap-x-8">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-1" style={{ color: c.titles, textDecoration: 'underline', textDecorationColor: c.lines }}>{data.clientName || "___"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="ml-1" style={{ color: c.titles, textDecoration: 'underline', textDecorationColor: c.lines }}>{data.clientPhone || "___"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de servicios cotizados */}
          {data.items && data.items.length > 0 && (
            <div className="pb-4" style={{ borderBottom: `1px solid ${c.lines}` }}>
              <h3 className="text-lg font-semibold mb-3 text-center" style={{ color: c.titles }}>SERVICIOS COTIZADOS</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${c.lines}` }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', color: c.titles, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Descripción
                    </th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', color: c.titles, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${lightenColor(c.lines, 0.5)}`, backgroundColor: index % 2 === 0 ? '#ffffff' : lightenColor(c.header, 0.85) }}>
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
          <div className="flex justify-end items-center gap-4 pt-2 pb-2 px-4 rounded-lg" style={{ background: `linear-gradient(to right, ${headerBgLight}, ${headerBgLighter})` }}>
            <span className="text-xl font-bold text-gray-800">PRECIO FINAL:</span>
            <span className="text-2xl font-bold" style={{ color: c.finalPrice }}>
              {s ? fmt(s.finalPrice) : `${cs}${total.toLocaleString()}`}
            </span>
          </div>

          {/* Deposit message */}
          <div className="text-center text-gray-600 py-4">
            {data.depositMessage.replace("{percentage}", data.depositPercentage.toString())}
          </div>

          {/* Valid until */}
          {data.validUntil && (
            <div className="text-center text-sm text-gray-500 -mt-2 pb-2">
              Cotización válida hasta: <span className="font-semibold" style={{ color: c.titles }}>
                {(() => {
                  try {
                    return format(new Date(data.validUntil + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es });
                  } catch {
                    return data.validUntil;
                  }
                })()}
              </span>
            </div>
          )}

          {/* Custom note */}
          {data.customNote && (
            <div className="text-center italic text-sm py-2" style={{ color: c.titles }}>{data.customNote}</div>
          )}

          {/* Thank you message */}
          <div className="relative p-6 text-center" style={{ background: `linear-gradient(to right, ${lightenColor(c.header, 0.85)}, white)` }}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
              <Heart className="w-4 h-4" style={{ color: c.lines, fill: lightenColor(c.lines, 0.5) }} />
              <Heart className="w-3 h-3" style={{ color: lightenColor(c.lines, 0.3), fill: lightenColor(c.lines, 0.7) }} />
            </div>
            <p className="text-lg font-medium text-gray-700 italic">"{data.thankYouMessage}"</p>
            <div className="absolute right-4 bottom-2">
              <svg width="40" height="20" viewBox="0 0 40 20" style={{ color: c.lines }}>
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