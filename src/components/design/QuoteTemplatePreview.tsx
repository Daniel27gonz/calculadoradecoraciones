import { useRef, useState } from "react";
import { QuoteTemplateData } from "@/pages/Design";
import { Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";

interface QuoteTemplatePreviewProps {
  data: QuoteTemplateData;
  total: number;
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 px-2">
      <span className="flex items-center gap-2 text-gray-700 text-sm">
        <span>{icon}</span> {label}
      </span>
      <span className="text-gray-800 font-medium text-sm">{value}</span>
    </div>
  );
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
        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-100 to-pink-50 p-6">
          <div className="absolute top-2 right-4 flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-pink-300" style={{ opacity: Math.random() * 0.5 + 0.3 }} />
            ))}
          </div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-center gap-2">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center overflow-hidden">
                {data.businessLogo ? (
                  <img src={data.businessLogo} alt={data.businessName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🎈</span>
                )}
              </div>
              <span className="text-lg font-bold text-pink-600 text-center">{data.businessName}</span>
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">COTIZACIÓN DE</h1>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">DECORACIÓN CON GLOBOS</h2>
            </div>
          </div>
          <div className="text-right mt-4 text-gray-600">Fecha: {data.quoteDate}</div>
        </div>

        {/* Client data */}
        <div className="p-6 space-y-4 bg-white">
          <div className="border-b border-pink-100 pb-4">
            <h3 className="text-lg font-semibold text-pink-500 mb-3">DATOS DEL CLIENTE:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-2">
                <span className="text-gray-600">Fecha y lugar del evento:</span>
                <span className="text-pink-500 underline decoration-pink-300">
                  {data.eventDate || "___"}, {data.eventLocation || "___"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tema o tipo de decoración:</span>
                <Heart className="w-4 h-4 text-pink-300" />
              </div>
              <div className="text-pink-500 ml-4">{data.decorationType || "___"}</div>
              <div className="flex flex-wrap gap-x-8">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="text-pink-500 underline decoration-pink-300 ml-1">{data.clientName || "___"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Teléfono:</span>
                  <span className="text-pink-500 underline decoration-pink-300 ml-1">{data.clientPhone || "___"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Summary - only show when a quote is loaded */}
          {s && (
            <div className="border-b border-pink-100 pb-4">
              <h3 className="text-lg font-semibold text-pink-500 mb-3">RESUMEN DE COTIZACIÓN:</h3>
              <div className="space-y-0.5">
                <SummaryRow icon="🎀" label="Materiales no reutilizables" value={fmt(s.totalMaterials)} />
                <SummaryRow icon="🧮" label="Materiales reutilizables" value={fmt(s.totalReusableMaterials)} />
                <SummaryRow icon="📉" label={`Merma (${s.wastagePercentage}%)`} value={fmt(s.wastage)} />
                <SummaryRow icon="👩‍🎨" label="Total mano de obra" value={fmt(s.totalLabor)} />
                <SummaryRow icon="🚗" label="Total transporte" value={fmt(s.totalTransport)} />
                <SummaryRow icon="✨" label="Total extras" value={fmt(s.totalExtras)} />
                <SummaryRow icon="📊" label="Gastos indirectos" value={fmt(s.indirectExpenses)} />

                <div className="flex justify-between items-center pt-2 mt-2 border-t border-pink-100 font-bold px-2">
                  <span className="text-gray-800">Total General</span>
                  <span className="text-gray-800">{fmt(s.totalCost)}</span>
                </div>

                <div className="flex justify-between items-center text-gray-600 text-sm px-2">
                  <span>Margen de ganancia ({s.marginPercentage}%)</span>
                  <span>{fmt(s.finalPrice - s.totalCost)}</span>
                </div>
              </div>
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
