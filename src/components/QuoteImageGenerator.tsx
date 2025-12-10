import { forwardRef } from 'react';
import { Quote, CostSummary } from '@/types/quote';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteImageGeneratorProps {
  quote: Quote;
  summary: CostSummary;
  currencySymbol: string;
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const QuoteImageGenerator = forwardRef<HTMLDivElement, QuoteImageGeneratorProps>(
  ({ quote, summary, currencySymbol }, ref) => {
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const phaseNames: Record<string, string> = {
      planning: 'Planificación',
      preparation: 'Preparación',
      setup: 'Montaje',
      teardown: 'Desmontaje',
    };

    return (
      <div
        ref={ref}
        style={{
          width: '600px',
          padding: '32px',
          background: 'linear-gradient(135deg, #fce4ec, #e8d5e7, #f5f0e8)',
          fontFamily: 'Quicksand, sans-serif',
          color: '#4a3a42',
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid #e8bfc7',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💜</div>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: 600,
              color: '#7a5a6a',
              margin: '0 0 4px 0',
            }}
          >
            Cotización
          </h1>
          <p style={{ fontSize: '14px', color: '#8a7a82', margin: 0 }}>
            Calculadora para Decoradoras
          </p>
        </div>

        {/* Client Info Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px -4px rgba(200, 150, 170, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#a09098', margin: '0 0 4px 0' }}>Cliente</p>
              <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>
                {quote.clientName || 'Sin especificar'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#a09098', margin: '0 0 4px 0' }}>Fecha evento</p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {quote.eventDate
                  ? format(new Date(quote.eventDate), "d 'de' MMMM, yyyy", { locale: es })
                  : 'Por definir'}
              </p>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: '#b0a0a8', marginTop: '12px', marginBottom: 0 }}>
            Cotización generada el {currentDate}
          </p>
        </div>

        {/* Cost Breakdown */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '16px',
            boxShadow: '0 4px 20px -4px rgba(200, 150, 170, 0.15)',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#6a5a62',
            }}
          >
            📊 Desglose de Costos
          </h2>

          {/* Balloons */}
          {quote.balloons.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#7a5a6a', margin: '0 0 6px 0' }}>
                🎈 Globos
              </p>
              {quote.balloons.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    padding: '4px 0',
                    borderBottom: '1px dashed #f0e8ec',
                  }}
                >
                  <span style={{ color: '#6a5a62' }}>
                    {b.description || 'Globo'} × {b.quantity}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {currencySymbol}{formatCurrency((b.pricePerUnit || 0) * (b.quantity || 0))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Materials */}
          {quote.materials.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#7a5a6a', margin: '0 0 6px 0' }}>
                🎀 Materiales
              </p>
              {quote.materials.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    padding: '4px 0',
                    borderBottom: '1px dashed #f0e8ec',
                  }}
                >
                  <span style={{ color: '#6a5a62' }}>
                    {m.name || 'Material'} × {m.quantity}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {currencySymbol}{formatCurrency((m.costPerUnit || 0) * (m.quantity || 0))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Labor */}
          {quote.timePhases.some((t) => t.hours > 0) && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#7a5a6a', margin: '0 0 6px 0' }}>
                👩‍🎨 Mano de Obra
              </p>
              {quote.timePhases
                .filter((t) => t.hours > 0)
                .map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      padding: '4px 0',
                      borderBottom: '1px dashed #f0e8ec',
                    }}
                  >
                    <span style={{ color: '#6a5a62' }}>
                      {phaseNames[t.phase] || t.phase}: {t.hours}h
                    </span>
                    <span style={{ fontWeight: 500 }}>
                      {currencySymbol}{formatCurrency(t.hours * t.rate)}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Summary Lines */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '2px solid #f0e8ec',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '4px 0',
              }}
            >
              <span>Subtotal Globos</span>
              <span>{currencySymbol}{formatCurrency(summary.totalBalloons)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '4px 0',
              }}
            >
              <span>Subtotal Materiales</span>
              <span>{currencySymbol}{formatCurrency(summary.totalMaterials)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '4px 0',
              }}
            >
              <span>Subtotal Mano de Obra</span>
              <span>{currencySymbol}{formatCurrency(summary.totalLabor + summary.totalTime)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                padding: '4px 0',
              }}
            >
              <span>Herramientas ({quote.toolWearPercentage}%)</span>
              <span>{currencySymbol}{formatCurrency(summary.toolWear)}</span>
            </div>
            {summary.totalTransport > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  padding: '4px 0',
                }}
              >
                <span>Transporte</span>
                <span>{currencySymbol}{formatCurrency(summary.totalTransport)}</span>
              </div>
            )}
            {summary.totalExtras > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  padding: '4px 0',
                }}
              >
                <span>Extras</span>
                <span>{currencySymbol}{formatCurrency(summary.totalExtras)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Final Price Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #d4a5b9, #b5a0c9)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 8px 30px -8px rgba(200, 150, 170, 0.4)',
          }}
        >
          <p style={{ fontSize: '12px', opacity: 0.9, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Precio Final
          </p>
          <p
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '36px',
              fontWeight: 700,
              margin: '0 0 8px 0',
            }}
          >
            {currencySymbol}{formatCurrency(summary.finalPrice)}
          </p>
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '20px',
              padding: '6px 16px',
              fontSize: '12px',
            }}
          >
            Ganancia: {currencySymbol}{formatCurrency(summary.netProfit)} ({summary.profitPercentage.toFixed(0)}%)
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px -4px rgba(200, 150, 170, 0.15)',
            }}
          >
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#7a5a6a', margin: '0 0 6px 0' }}>
              📝 Notas
            </p>
            <p style={{ fontSize: '12px', color: '#6a5a62', margin: 0, lineHeight: 1.5 }}>
              {quote.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '11px',
            color: '#a09098',
            marginTop: '20px',
            marginBottom: 0,
          }}
        >
          Generado con 💜 Calculadora para Decoradoras
        </p>
      </div>
    );
  }
);

QuoteImageGenerator.displayName = 'QuoteImageGenerator';
