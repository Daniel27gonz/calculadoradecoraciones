import { forwardRef } from 'react';
import { Quote, CostSummary } from '@/types/quote';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteImageGeneratorProps {
  quote: Quote;
  summary: CostSummary;
  currencySymbol: string;
  marginPercentage?: number;
  logoUrl?: string | null;
  businessName?: string | null;
}

const fmt = (amount: number, symbol: string) =>
  `${symbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  fontSize: '13px',
};

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <span style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{icon}</span> {label}
      </span>
      <span style={{ fontWeight: 600, color: '#333' }}>{value}</span>
    </div>
  );
}

export const QuoteImageGenerator = forwardRef<HTMLDivElement, QuoteImageGeneratorProps>(
  ({ quote, summary, currencySymbol, logoUrl, businessName }, ref) => {
    const cs = currencySymbol;
    const eventDateFormatted = quote.eventDate
      ? format(new Date(quote.eventDate + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })
      : 'Por definir';

    return (
      <div
        ref={ref}
        style={{
          width: '500px',
          padding: '40px',
          background: '#ffffff',
          fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
          color: '#333333',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #f8c8d4' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px' }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px' }}
                crossOrigin="anonymous"
              />
            ) : (
              <span style={{ fontSize: '24px' }}>📍</span>
            )}
            {businessName && (
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#db2777', margin: '8px 0 0 0' }}>
                {businessName}
              </p>
            )}
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#f5a5b8', margin: '0', letterSpacing: '2px', textAlign: 'center' }}>
            Cotización
          </h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', marginTop: '8px', marginBottom: '0' }}>
            {format(new Date(quote.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        {/* Client Info */}
        <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #f8c8d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#999', fontSize: '14px', marginRight: '8px' }}>👤</span>
            <span style={{ fontSize: '14px', color: '#666' }}>Cliente:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333' }}>
              {quote.clientName || 'Sin especificar'}
            </span>
          </div>
          {quote.clientPhone && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#999', fontSize: '14px', marginRight: '8px' }}>📱</span>
              <span style={{ fontSize: '14px', color: '#666' }}>Teléfono:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333' }}>
                {quote.clientPhone}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#999', fontSize: '14px', marginRight: '8px' }}>📅</span>
            <span style={{ fontSize: '14px', color: '#666' }}>Fecha del evento:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333' }}>
              {eventDateFormatted}
            </span>
          </div>
        </div>

        {/* Descripción de la decoración */}
        {quote.decorationDescription && (
          <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #f8c8d4' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#db2777', margin: '0 0 12px 0', letterSpacing: '1px' }}>
              DESCRIPCIÓN DE LA DECORACIÓN
            </p>
            <p style={{ fontSize: '13px', color: '#555', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {quote.decorationDescription}
            </p>
          </div>
        )}

        {/* Final Price */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%)',
            borderRadius: '12px',
            border: '2px solid #f5a5b8',
          }}
        >
          <p style={{ fontSize: '12px', color: '#999', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>💰</span><span>PRECIO FINAL</span>
          </p>
          <p style={{ fontSize: '42px', fontWeight: 700, color: '#f5a5b8', margin: '0', letterSpacing: '1px' }}>
            {fmt(summary.finalPrice, cs)}
          </p>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#888', margin: '0 0 8px 0' }}>Notas:</p>
            <div style={{ padding: '12px', border: '1px solid #f0e0e5', borderRadius: '8px', background: '#fefefe' }}>
              <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.6 }}>{quote.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#bbb', marginTop: '16px', marginBottom: 0 }}>
          ♥️ Gracias por confiar en nuestros servicios ✨
        </p>
      </div>
    );
  }
);

QuoteImageGenerator.displayName = 'QuoteImageGenerator';
