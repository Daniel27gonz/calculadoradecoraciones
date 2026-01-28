import { forwardRef } from 'react';
import { Heart } from 'lucide-react';
import { QuotePdfData } from '@/hooks/useQuotePdfDownload';

interface QuotePdfPreviewProps {
  data: QuotePdfData;
}

const QuotePdfPreview = forwardRef<HTMLDivElement, QuotePdfPreviewProps>(
  ({ data }, ref) => {
    const depositAmount = (data.total * data.depositPercentage) / 100;

    return (
      <div 
        ref={ref}
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        style={{ width: '800px', fontFamily: 'system-ui, sans-serif' }}
      >
        {/* Header con fondo rosa */}
        <div 
          className="relative p-6"
          style={{ background: 'linear-gradient(to right, #fce7f3, #fdf2f8)' }}
        >
          {/* Decoraciones de puntos */}
          <div className="absolute top-2 right-4 flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ 
                  backgroundColor: '#f9a8d4',
                  opacity: 0.5 + Math.random() * 0.5 
                }}
              />
            ))}
          </div>

          <div className="flex items-start justify-between">
            {/* Logo y nombre del negocio */}
            <div className="flex items-center gap-3">
              {data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-full object-contain"
                  crossOrigin="anonymous"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(to bottom right, #fbcfe8, #fce7f3)' }}
                >
                  <span className="text-2xl">🎈</span>
                </div>
              )}
              <span className="text-xl font-bold" style={{ color: '#db2777' }}>
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
          <div className="border-b pb-4" style={{ borderColor: '#fce7f3' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#ec4899' }}>
              DATOS DEL CLIENTE:
            </h3>
            
            <div className="space-y-2 text-sm">
              {data.eventDate && (
                <div className="flex flex-wrap gap-x-2">
                  <span className="text-gray-600">Fecha del evento:</span>
                  <span style={{ color: '#ec4899' }}>
                    {data.eventDate}
                    {data.eventLocation && `, ${data.eventLocation}`}
                  </span>
                </div>
              )}
              
              {data.decorationType && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tema o tipo de decoración:</span>
                    <Heart className="w-4 h-4" style={{ color: '#f9a8d4' }} />
                  </div>
                  <div className="ml-4" style={{ color: '#ec4899' }}>
                    {data.decorationType}
                  </div>
                </>
              )}
              
              <div className="flex flex-wrap gap-x-8">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-1" style={{ color: '#ec4899' }}>
                    {data.clientName}
                  </span>
                </div>
                {data.clientPhone && (
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-1" style={{ color: '#ec4899' }}>
                      {data.clientPhone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de items */}
          <div className="relative">
            {/* Borde decorativo */}
            <div 
              className="absolute -left-2 top-0 bottom-0 w-1"
              style={{ borderLeft: '2px dashed #fbcfe8' }}
            />
            <div 
              className="absolute -right-2 top-0 bottom-0 w-1"
              style={{ borderRight: '2px dashed #fbcfe8' }}
            />
            
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(to right, #fce7f3, #fdf2f8)' }}>
                  <th 
                    className="text-left py-3 px-4 font-semibold"
                    style={{ color: '#ec4899' }}
                  >
                    DESCRIPCIÓN
                  </th>
                  <th 
                    className="text-center py-3 px-4 font-semibold"
                    style={{ color: '#ec4899' }}
                  >
                    CANTIDAD
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-semibold"
                    style={{ color: '#ec4899' }}
                  >
                    PRECIO
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b"
                    style={{ borderColor: '#fdf2f8' }}
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {item.description || "—"}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      ${item.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Servicios adicionales */}
          {data.additionalServices.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-600 font-medium underline">
                Servicios adicionales:
              </p>
              {data.additionalServices.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between items-center pl-4 border-b pb-2"
                  style={{ borderColor: '#fdf2f8' }}
                >
                  <span className="text-gray-700">{service.description}</span>
                  <span className="text-gray-700">
                    ${service.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div 
            className="flex justify-end items-center gap-4 pt-4 border-t-2"
            style={{ borderColor: '#fbcfe8' }}
          >
            <span className="text-xl font-bold text-gray-800">TOTAL:</span>
            <span className="text-2xl font-bold text-gray-900">
              ${data.total.toLocaleString()}
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
            <div 
              className="text-center italic text-sm py-2"
              style={{ color: '#ec4899' }}
            >
              {data.customNote}
            </div>
          )}

          {/* Mensaje de agradecimiento */}
          <div 
            className="relative p-6 text-center"
            style={{ background: 'linear-gradient(to right, #fdf2f8, white)' }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
              <Heart 
                className="w-4 h-4" 
                style={{ color: '#f9a8d4', fill: '#fbcfe8' }} 
              />
              <Heart 
                className="w-3 h-3" 
                style={{ color: '#fbcfe8', fill: '#fce7f3' }} 
              />
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
                style={{ color: '#f9a8d4' }}
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
    );
  }
);

QuotePdfPreview.displayName = 'QuotePdfPreview';

export default QuotePdfPreview;
