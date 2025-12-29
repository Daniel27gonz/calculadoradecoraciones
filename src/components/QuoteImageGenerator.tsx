import { forwardRef } from 'react';
import { Quote, CostSummary } from '@/types/quote';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuoteImageGeneratorProps {
  quote: Quote;
  summary: CostSummary;
  currencySymbol: string;
  marginPercentage?: number;
}

const formatCurrency = (amount: number, symbol: string) => {
  return `${symbol}${amount.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const QuoteImageGenerator = forwardRef<HTMLDivElement, QuoteImageGeneratorProps>(
  ({ quote, summary, currencySymbol, marginPercentage }, ref) => {
    const eventDateFormatted = quote.eventDate
      ? format(new Date(quote.eventDate), "d 'de' MMMM, yyyy", { locale: es })
      : 'Por definir';

    // Calculate totals for display
    const materialsTotal = summary.totalBalloons + summary.totalMaterials;
    const laborTotal = summary.totalLabor + summary.totalTime;
    const transportTotal = summary.totalTransport;
    const toolsTotal = summary.toolWear;
    const extrasTotal = summary.totalExtras;
    const realCost = summary.totalCost;
    const profit = summary.netProfit;
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
            textAlign: 'center',
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '1px solid #f8c8d4',
          }}
        >
          <p style={{ fontSize: '14px', color: '#999999', margin: '0 0 8px 0' }}>📍</p>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#f5a5b8',
              margin: '0',
              letterSpacing: '2px',
            }}
          >
            Cotización
          </h1>
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#999999', fontSize: '14px', marginRight: '8px' }}>📅</span>
            <span style={{ fontSize: '14px', color: '#333333' }}>
              {eventDateFormatted}
            </span>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div style={{ marginBottom: '28px' }}>
          {/* Materials */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '12px' }}>📦</span>
              <span style={{ fontSize: '14px', color: '#555555' }}>Materiales</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
              {formatCurrency(materialsTotal, currencySymbol)}
            </span>
          </div>

          {/* Labor */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '12px' }}>🕑</span>
              <span style={{ fontSize: '14px', color: '#555555' }}>Mano de obra</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
              {formatCurrency(laborTotal, currencySymbol)}
            </span>
          </div>

          {/* Transport */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '12px' }}>🚚</span>
              <span style={{ fontSize: '14px', color: '#555555' }}>Transporte</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
              {formatCurrency(transportTotal, currencySymbol)}
            </span>
          </div>

          {/* Tools */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '12px' }}>🛠</span>
              <span style={{ fontSize: '14px', color: '#555555' }}>Herramientas</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
              {formatCurrency(toolsTotal, currencySymbol)}
            </span>
          </div>

          {/* Extras / Indirect Costs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #f5f5f5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#999999', fontSize: '14px', marginRight: '12px' }}>📊</span>
              <span style={{ fontSize: '14px', color: '#555555' }}>Costos indirectos</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>
              {formatCurrency(extrasTotal, currencySymbol)}
            </span>
          </div>
        </div>

        {/* Real Cost */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderTop: '1px solid #f8c8d4',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#555555' }}>Costo Real:</span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#333333' }}>
            {formatCurrency(realCost, currencySymbol)}
          </span>
        </div>

        {/* Profit */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#555555' }}>
            Ganancia ({marginPercentage ?? quote.marginPercentage ?? 0}%):
          </span>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#22c55e' }}>
            {formatCurrency(profit, currencySymbol)}
          </span>
        </div>

        {/* Final Price */}
        <div
          style={{
            textAlign: 'center',
            padding: '24px',
            marginBottom: '24px',
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
            }}
          >
            <span>💰</span>
            <span>PRECIO FINAL</span>
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

        {/* Notes Section */}
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
              minHeight: '60px',
              padding: '12px',
              border: '1px solid #f0e0e5',
              borderRadius: '8px',
              background: '#fefefe',
            }}
          >
            {quote.notes && (
              <p style={{ fontSize: '13px', color: '#666666', margin: 0, lineHeight: 1.6 }}>
                {quote.notes}
              </p>
            )}
          </div>
        </div>

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
          Generado con 💜 Calculadora para Decoradoras
        </p>
      </div>
    );
  }
);

QuoteImageGenerator.displayName = 'QuoteImageGenerator';
