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

const QuoteTemplatePreview = ({ data, total }: QuoteTemplatePreviewProps) => {
  const depositAmount = (total * data.depositPercentage) / 100;
  const templateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!templateRef.current) return;

    setIsDownloading(true);
    console.log("Descarga PDF iniciada");

    try {
      // Clone the element to avoid modifying the original
      const clone = templateRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = "0";
      clone.style.left = "0";
      clone.style.zIndex = "9999";
      clone.style.background = "white";
      clone.style.width = "800px";
      clone.style.visibility = "visible";
      document.body.appendChild(clone);

      // Wait for rendering
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove clone
      document.body.removeChild(clone);

      // Generate filename
      const clientName = data.clientName || "cotizacion";
      const sanitizedName = clientName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "").replace(/\s+/g, "-");
      const fileName = `cotizacion-${sanitizedName}-${new Date().toISOString().split("T")[0]}`;

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate PDF dimensions (A4 in mm: 210 x 297)
      const pdfWidth = 210;
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
      
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);

      console.log("Descarga PDF completada");
      toast({
        title: "¡Descargado!",
        description: "La cotización se ha descargado como PDF",
      });
    } catch (error) {
      console.error("Error en la descarga:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar la cotización",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Descargando..." : "Descargar PDF"}
        </Button>
      </div>

      {/* Template Content */}
      <div ref={templateRef} className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header con fondo rosa */}
      <div className="relative bg-gradient-to-r from-pink-100 to-pink-50 p-6">
        {/* Decoraciones de puntos */}
        <div className="absolute top-2 right-4 flex gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-pink-300"
              style={{ opacity: Math.random() * 0.5 + 0.3 }}
            />
          ))}
        </div>

        <div className="flex items-start justify-between">
          {/* Logo y nombre del negocio */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center overflow-hidden">
              {data.businessLogo ? (
                <img
                  src={data.businessLogo}
                  alt={data.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🎈</span>
              )}
            </div>
            <span className="text-lg font-bold text-pink-600 text-center">
              {data.businessName}
            </span>
          </div>

          {/* Título */}
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">
              COTIZACIÓN DE
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">
              DECORACIÓN CON GLOBOS
            </h2>
          </div>
        </div>

        {/* Fecha de cotización */}
        <div className="text-right mt-4 text-gray-600">
          Fecha: {data.quoteDate}
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="p-6 space-y-4 bg-white">
        <div className="border-b border-pink-100 pb-4">
          <h3 className="text-lg font-semibold text-pink-500 mb-3">
            DATOS DEL CLIENTE:
          </h3>
          
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
            <div className="text-pink-500 ml-4">
              {data.decorationType || "___"}
            </div>
            
            <div className="flex flex-wrap gap-x-8">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="text-pink-500 underline decoration-pink-300 ml-1">
                  {data.clientName || "___"}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Teléfono:</span>
                <span className="text-pink-500 underline decoration-pink-300 ml-1">
                  {data.clientPhone || "___"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Concepto de servicio simplificado para el cliente */}
        <div className="relative">
          {/* Borde decorativo */}
          <div className="absolute -left-2 top-0 bottom-0 w-1 border-l-2 border-dashed border-pink-200" />
          <div className="absolute -right-2 top-0 bottom-0 w-1 border-r-2 border-dashed border-pink-200" />
          
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-pink-100 to-pink-50">
                <th className="text-left py-3 px-4 text-pink-500 font-semibold">
                  SERVICIO
                </th>
                <th className="text-right py-3 px-4 text-pink-500 font-semibold">
                  PRECIO
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-pink-50">
                <td className="py-4 px-4 text-gray-700">
                  <div className="font-medium">Servicio de decoración con globos</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {data.decorationType || "Decoración personalizada"}
                  </div>
                </td>
                <td className="py-4 px-4 text-right text-gray-700 font-medium">
                  ${total.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center gap-4 pt-4 border-t-2 border-pink-200">
          <span className="text-xl font-bold text-gray-800">TOTAL:</span>
          <span className="text-2xl font-bold text-gray-900">
            ${total.toLocaleString()}
          </span>
        </div>

        {/* Mensaje de anticipo */}
        <div className="text-center text-gray-600 py-4">
          {data.depositMessage.replace(
            "{percentage}",
            data.depositPercentage.toString()
          )}
        </div>

        {/* Nota personalizada */}
        {data.customNote && (
          <div className="text-center italic text-pink-500 text-sm py-2">
            {data.customNote}
          </div>
        )}

        {/* Mensaje de agradecimiento */}
        <div className="relative bg-gradient-to-r from-pink-50 to-white p-6 text-center">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
            <Heart className="w-4 h-4 text-pink-300 fill-pink-200" />
            <Heart className="w-3 h-3 text-pink-200 fill-pink-100" />
          </div>
          
          <p className="text-lg font-medium text-gray-700 italic">
            "{data.thankYouMessage}"
          </p>
          
          {/* Decoración de línea ondulada */}
          <div className="absolute right-4 bottom-2">
            <svg
              width="40"
              height="20"
              viewBox="0 0 40 20"
              className="text-pink-300"
            >
              <path
                d="M0 10 Q10 0 20 10 Q30 20 40 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default QuoteTemplatePreview;
