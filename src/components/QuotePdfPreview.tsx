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
        {/* Header con borde elegante */}
        <div 
          className="relative p-6"
          style={{ 
            background: 'linear-gradient(135deg, #fdf8f5, #fdf2f8, #fdf8f5)',
            borderBottom: '2px solid #d4a574'
          }}
        >
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
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo" className="object-contain mb-2" style={{ width: '120px', height: '120px' }} crossOrigin="anonymous" />
              ) : (
                <div className="flex items-center justify-center mb-2" style={{ width: '120px', height: '120px', background: 'linear-gradient(to bottom right, #fbcfe8, #fce7f3)', borderRadius: '50%' }}>
                  <span className="text-4xl">🎈</span>
                </div>
              )}
              <span className="text-lg font-semibold italic" style={{ color: '#8b6f5e', fontFamily: 'Georgia, serif' }}>{data.businessName}</span>
            </div>

            {/* Datos del cliente al costado derecho */}
            <div className="text-right space-y-1" style={{ flex: '1 1 50%', paddingTop: '12px' }}>
              <p className="text-base font-bold" style={{ color: '#4a3728' }}>{data.clientName}</p>
              {data.eventLocation && (
                <p className="text-sm" style={{ color: '#6b5c4f' }}>{data.eventLocation}</p>
              )}
              <p className="text-sm" style={{ color: '#6b5c4f' }}>Fecha: {data.quoteDate}</p>
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

        <div className="p-6 space-y-4 bg-white">


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
