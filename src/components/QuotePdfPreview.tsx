import { forwardRef } from 'react';
import { Heart } from 'lucide-react';
import { QuotePdfData } from '@/hooks/useQuotePdfDownload';

interface QuotePdfPreviewProps {
  data: QuotePdfData;
}

const QuotePdfPreview = forwardRef<HTMLDivElement, QuotePdfPreviewProps>(
  ({ data }, ref) => {
    const depositAmount = (data.total * data.depositPercentage) / 100;
    const cs = data.currencySymbol || '$';
    const s = data.summary;

    const fmt = (amount: number) =>
      `${cs}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <div className="absolute top-2 right-4 flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: '#f9a8d4', opacity: 0.5 + Math.random() * 0.5 }}
              />
            ))}
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-contain" crossOrigin="anonymous" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #fbcfe8, #fce7f3)' }}>
                  <span className="text-2xl">🎈</span>
                </div>
              )}
              <span className="text-xl font-bold" style={{ color: '#db2777' }}>{data.businessName}</span>
            </div>
            <div className="text-right">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">COTIZACIÓN DE</h1>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-wide">DECORACIÓN CON GLOBOS</h2>
            </div>
          </div>
          <div className="text-right mt-4 text-gray-600">Fecha: {data.quoteDate}</div>
        </div>

        {/* Datos del cliente */}
        <div className="p-6 space-y-4 bg-white">
          <div className="border-b pb-4" style={{ borderColor: '#fce7f3' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#ec4899' }}>DATOS DEL CLIENTE:</h3>
            <div className="space-y-2 text-sm">
              {data.eventDate && (
                <div className="flex flex-wrap gap-x-2">
                  <span className="text-gray-600">Fecha del evento:</span>
                  <span style={{ color: '#ec4899' }}>{data.eventDate}{data.eventLocation && `, ${data.eventLocation}`}</span>
                </div>
              )}
              {data.decorationType && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Tema o tipo de decoración:</span>
                    <Heart className="w-4 h-4" style={{ color: '#f9a8d4' }} />
                  </div>
                  <div className="ml-4" style={{ color: '#ec4899' }}>{data.decorationType}</div>
                </>
              )}
              <div className="flex flex-wrap gap-x-8">
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-1" style={{ color: '#ec4899' }}>{data.clientName}</span>
                </div>
                {data.clientPhone && (
                  <div>
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="ml-1" style={{ color: '#ec4899' }}>{data.clientPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descripción de la decoración */}
          {data.decorationDescription && (
            <div className="border-b pb-4" style={{ borderColor: '#fce7f3' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#ec4899' }}>DESCRIPCIÓN DE LA DECORACIÓN:</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap m-0">
                {data.decorationDescription}
              </p>
            </div>
          )}

          {/* Tabla de servicios cotizados */}
          {data.items && data.items.length > 0 && (
            <div className="border-b pb-4" style={{ borderColor: '#fce7f3' }}>
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#ec4899' }}>SERVICIOS COTIZADOS:</h3>
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
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Precio Final */}
          <div 
            className="flex justify-end items-center gap-4 pt-2 pb-2 px-4 rounded-lg"
            style={{ background: 'linear-gradient(to right, #fce7f3, #fdf2f8)' }}
          >
            <span className="text-xl font-bold text-gray-800">PRECIO FINAL:</span>
            <span className="text-2xl font-bold" style={{ color: '#db2777' }}>
              {fmt(s.finalPrice)}
            </span>
          </div>

          {/* Mensaje de anticipo */}
          <div className="text-center text-gray-600 py-4">
            {data.depositMessage.replace("{percentage}", data.depositPercentage.toString())}
          </div>

          {/* Nota personalizada */}
          {data.customNote && (
            <div className="text-center italic text-sm py-2" style={{ color: '#ec4899' }}>
              {data.customNote}
            </div>
          )}

          {/* Mensaje de agradecimiento */}
          <div className="relative p-6 text-center" style={{ background: 'linear-gradient(to right, #fdf2f8, white)' }}>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
              <Heart className="w-4 h-4" style={{ color: '#f9a8d4', fill: '#fbcfe8' }} />
              <Heart className="w-3 h-3" style={{ color: '#fbcfe8', fill: '#fce7f3' }} />
            </div>
            <p className="text-lg font-medium text-gray-700 italic">"{data.thankYouMessage}"</p>
            <div className="absolute right-4 bottom-2">
              <svg width="40" height="20" viewBox="0 0 40 20" style={{ color: '#f9a8d4' }}>
                <path d="M0 10 Q10 0 20 10 Q30 20 40 10" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="flex items-center gap-2 text-gray-700">
        <span>{icon}</span> {label}
      </span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

QuotePdfPreview.displayName = 'QuotePdfPreview';

export default QuotePdfPreview;
