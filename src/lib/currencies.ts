export interface Currency {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
}

export const LATAM_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Dólar estadounidense', symbol: '$', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MXN', name: 'Peso mexicano', symbol: '$', country: 'México', flag: '🇲🇽' },
  { code: 'ARS', name: 'Peso argentino', symbol: '$', country: 'Argentina', flag: '🇦🇷' },
  { code: 'COP', name: 'Peso colombiano', symbol: '$', country: 'Colombia', flag: '🇨🇴' },
  { code: 'CLP', name: 'Peso chileno', symbol: '$', country: 'Chile', flag: '🇨🇱' },
  { code: 'PEN', name: 'Sol peruano', symbol: 'S/', country: 'Perú', flag: '🇵🇪' },
  { code: 'BRL', name: 'Real brasileño', symbol: 'R$', country: 'Brasil', flag: '🇧🇷' },
  { code: 'UYU', name: 'Peso uruguayo', symbol: '$U', country: 'Uruguay', flag: '🇺🇾' },
  { code: 'PYG', name: 'Guaraní', symbol: '₲', country: 'Paraguay', flag: '🇵🇾' },
  { code: 'BOB', name: 'Boliviano', symbol: 'Bs', country: 'Bolivia', flag: '🇧🇴' },
  { code: 'VES', name: 'Bolívar', symbol: 'Bs', country: 'Venezuela', flag: '🇻🇪' },
  { code: 'CRC', name: 'Colón costarricense', symbol: '₡', country: 'Costa Rica', flag: '🇨🇷' },
  { code: 'GTQ', name: 'Quetzal', symbol: 'Q', country: 'Guatemala', flag: '🇬🇹' },
  { code: 'HNL', name: 'Lempira', symbol: 'L', country: 'Honduras', flag: '🇭🇳' },
  { code: 'NIO', name: 'Córdoba', symbol: 'C$', country: 'Nicaragua', flag: '🇳🇮' },
  { code: 'PAB', name: 'Balboa', symbol: 'B/', country: 'Panamá', flag: '🇵🇦' },
  { code: 'DOP', name: 'Peso dominicano', symbol: 'RD$', country: 'República Dominicana', flag: '🇩🇴' },
  { code: 'CUP', name: 'Peso cubano', symbol: '$', country: 'Cuba', flag: '🇨🇺' },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return LATAM_CURRENCIES.find(c => c.code === code);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  if (!currency) return `$${amount.toFixed(2)}`;
  
  return `${currency.symbol}${amount.toLocaleString('es-LA', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}
