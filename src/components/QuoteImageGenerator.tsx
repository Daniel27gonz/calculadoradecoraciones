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

const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const QuoteImageGenerator = forwardRef<HTMLDivElement, QuoteImageGeneratorProps>(
  ({ quote, summary, currencySymbol, logoUrl, businessName }, ref) => {
    const eventDateFormatted = quote.eventDate
      ? format(new Date(quote.eventDate + 'T12:00:00'), "d 'de' MMMM, yyyy", { locale: es })
      : 'Por definir';

    const finalPrice = summary.finalPrice;

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
        <div
          style={{
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f8c8d4',
          }}
        >
          {/* Logo and Business Name - Left aligned, vertical */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '16px' }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                }}
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
          
        <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#f5a5b8',
              margin: '0',
              letterSpacing: '2px',
              textAlign: 'center',
            }}
          >
            Cotización
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              textAlign: 'center',
              marginTop: '8px',
              marginBottom: '0',
            }}
          >
            {format(new Date(quote.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>

        {/* Client Info */}
        <div
          style={{
            marginBottom: '28px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f8c8d4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#999999', fontSize: '14px', marginRight: '8px' }}>👤</span>
            <span style={{ fontSize: '14px', color: '#666666' }}>Cliente:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333333' }}>
              {quote.clientName || 'Sin especificar'}
            </span>
          </div>
          {quote.clientPhone && (
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '8px' }}>📱</span>
              <span style={{ fontSize: '14px', color: '#666666' }}>Teléfono:</span>
              <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333333' }}>
                {quote.clientPhone}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#999999', fontSize: '14px', marginRight: '8px' }}>📅</span>
            <span style={{ fontSize: '14px', color: '#666666' }}>Fecha del evento:</span>
            <span style={{ fontSize: '14px', fontWeight: 600, marginLeft: '8px', color: '#333333' }}>
              {eventDateFormatted}
            </span>
          </div>
        </div>

        {/* Service Concept - Simplified for client */}
        <div
          style={{
            marginBottom: '28px',
            padding: '20px',
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
            borderRadius: '12px',
            border: '1px solid #f8c8d4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: '#f5a5b8', fontSize: '18px', marginRight: '10px' }}>🎈</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333' }}>
              Servicio de decoración con globos
            </span>
          </div>
          {quote.eventType && (
            <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 0 28px' }}>
              {quote.eventType}
            </p>
          )}
        </div>

        {/* Reusable Materials Section */}
        {quote.reusableMaterialsUsed && quote.reusableMaterialsUsed.length > 0 && (
          <div
            style={{
              marginBottom: '28px',
              padding: '20px',
              background: '#fefefe',
              borderRadius: '12px',
              border: '1px solid #f8c8d4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#f5a5b8', fontSize: '18px', marginRight: '10px' }}>🧮</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333333' }}>
                Materiales reutilizables
              </span>
            </div>
            {quote.reusableMaterialsUsed.map((material, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < quote.reusableMaterialsUsed!.length - 1 ? '1px solid #f0e0e5' : 'none',
                }}
              >
                <span style={{ fontSize: '14px', color: '#666666' }}>
                  {material.name} {material.quantity > 1 ? `(×${material.quantity})` : ''}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>
                  {formatCurrency((material.costPerUse || 0) * (material.quantity || 1), currencySymbol)}
                </span>
              </div>
            ))}
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
          <p
            style={{
              fontSize: '12px',
              color: '#999999',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <span>💰</span>
            <span>PRECIO TOTAL</span>
          </p>
          <p
            style={{
              fontSize: '42px',
              fontWeight: 700,
              color: '#f5a5b8',
              margin: '0',
              letterSpacing: '1px',
            }}
          >
            {formatCurrency(finalPrice, currencySymbol)}
          </p>
        </div>

        {/* Notes Section - Only show if there are notes */}
        {quote.notes && (
          <div style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#888888',
                margin: '0 0 8px 0',
              }}
            >
              Notas:
            </p>
            <div
              style={{
                padding: '12px',
                border: '1px solid #f0e0e5',
                borderRadius: '8px',
                background: '#fefefe',
              }}
            >
              <p style={{ fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                {quote.notes}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#bbbbbb',
            marginTop: '16px',
            marginBottom: 0,
          }}
        >
          ♥️ Gracias por confiar en nuestros servicios ✨
        </p>
      </div>
    );
  }
);

QuoteImageGenerator.displayName = 'QuoteImageGenerator';
