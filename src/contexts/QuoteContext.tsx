import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quote, Package, Balloon, Material, Worker, TimePhase, Extra, CostSummary, ToolAmortization } from '@/types/quote';

interface QuoteContextType {
  // Current quote being edited
  currentQuote: Quote | null;
  setCurrentQuote: (quote: Quote | null) => void;
  
  // Saved quotes
  quotes: Quote[];
  saveQuote: (quote: Quote) => void;
  deleteQuote: (id: string) => void;
  duplicateQuote: (id: string) => Quote;
  
  // Packages
  packages: Package[];
  savePackage: (pkg: Package) => void;
  deletePackage: (id: string) => void;
  
  // Tool Amortization
  toolAmortization: ToolAmortization[];
  setToolAmortization: (tools: ToolAmortization[]) => void;
  
  // Calculations
  calculateCosts: (quote: Quote) => CostSummary;
  
  // Default hourly rate
  defaultHourlyRate: number;
  setDefaultHourlyRate: (rate: number) => void;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

const defaultPackages: Package[] = [
  {
    id: '1',
    name: 'Arco Orgánico',
    description: 'Arco de globos estilo orgánico con diferentes tamaños',
    icon: '🎈',
    estimatedBalloons: 150,
    estimatedMaterials: [
      { id: '1', name: 'Cinta de globos', costPerUnit: 5, quantity: 2 },
      { id: '2', name: 'Glue dots', costPerUnit: 8, quantity: 1 },
    ],
    estimatedHours: 4,
    suggestedPrice: 250,
  },
  {
    id: '2',
    name: 'Arco Básico',
    description: 'Arco sencillo con globos del mismo tamaño',
    icon: '🎀',
    estimatedBalloons: 80,
    estimatedMaterials: [
      { id: '1', name: 'Cinta de globos', costPerUnit: 5, quantity: 1 },
      { id: '2', name: 'Glue dots', costPerUnit: 8, quantity: 1 },
    ],
    estimatedHours: 2,
    suggestedPrice: 120,
  },
  {
    id: '3',
    name: 'Columnas',
    description: 'Par de columnas de globos para entrada',
    icon: '🏛️',
    estimatedBalloons: 100,
    estimatedMaterials: [
      { id: '1', name: 'Base PVC', costPerUnit: 15, quantity: 2 },
      { id: '2', name: 'Tubo PVC', costPerUnit: 8, quantity: 4 },
    ],
    estimatedHours: 2.5,
    suggestedPrice: 180,
  },
  {
    id: '4',
    name: 'Backdrop',
    description: 'Pared de globos para fotos',
    icon: '📸',
    estimatedBalloons: 200,
    estimatedMaterials: [
      { id: '1', name: 'Estructura', costPerUnit: 30, quantity: 1 },
      { id: '2', name: 'Glue dots', costPerUnit: 8, quantity: 2 },
    ],
    estimatedHours: 5,
    suggestedPrice: 350,
  },
  {
    id: '5',
    name: 'Centro de Mesa',
    description: 'Arreglo pequeño para mesa',
    icon: '🌸',
    estimatedBalloons: 15,
    estimatedMaterials: [
      { id: '1', name: 'Base', costPerUnit: 5, quantity: 1 },
      { id: '2', name: 'Cinta', costPerUnit: 2, quantity: 1 },
    ],
    estimatedHours: 0.5,
    suggestedPrice: 35,
  },
  {
    id: '6',
    name: 'Decoración Completa',
    description: 'Paquete completo para evento',
    icon: '✨',
    estimatedBalloons: 400,
    estimatedMaterials: [
      { id: '1', name: 'Varios materiales', costPerUnit: 50, quantity: 1 },
    ],
    estimatedHours: 8,
    suggestedPrice: 800,
  },
];

const defaultToolAmortization: ToolAmortization[] = [
  { id: '1', name: 'Cilindro mediano', cost: 0, recommendedUses: 60 },
  { id: '2', name: 'Cilindro grande', cost: 0, recommendedUses: 7 },
  { id: '3', name: 'Base metálica tipo "mesita"', cost: 0, recommendedUses: 40 },
  { id: '4', name: 'Arco de PVC completo', cost: 0, recommendedUses: 6 },
  { id: '5', name: 'Tubos de PVC extras', cost: 0, recommendedUses: 10 },
  { id: '6', name: 'Backdrop redondo metálico', cost: 0, recommendedUses: 80 },
  { id: '7', name: 'Soporte telescópico para telas', cost: 0, recommendedUses: 50 },
  { id: '8', name: 'Soporte metálico para burbuja', cost: 0, recommendedUses: 30 },
];

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [toolAmortization, setToolAmortization] = useState<ToolAmortization[]>(defaultToolAmortization);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(25);

  // Load from localStorage
  useEffect(() => {
    const savedQuotes = localStorage.getItem('balloon-quotes');
    const savedPackages = localStorage.getItem('balloon-packages');
    const savedRate = localStorage.getItem('balloon-hourly-rate');
    const savedTools = localStorage.getItem('balloon-tool-amortization');
    
    if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
    if (savedPackages) setPackages(JSON.parse(savedPackages));
    if (savedRate) setDefaultHourlyRate(Number(savedRate));
    if (savedTools) setToolAmortization(JSON.parse(savedTools));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('balloon-quotes', JSON.stringify(quotes));
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('balloon-packages', JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem('balloon-hourly-rate', String(defaultHourlyRate));
  }, [defaultHourlyRate]);

  useEffect(() => {
    localStorage.setItem('balloon-tool-amortization', JSON.stringify(toolAmortization));
  }, [toolAmortization]);

  const saveQuote = (quote: Quote) => {
    setQuotes(prev => {
      const existingIndex = prev.findIndex(q => q.id === quote.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...quote, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [...prev, quote];
    });
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const duplicateQuote = (id: string): Quote => {
    const original = quotes.find(q => q.id === id);
    if (!original) throw new Error('Quote not found');
    
    const newQuote: Quote = {
      ...original,
      id: crypto.randomUUID(),
      clientName: `${original.clientName} (copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveQuote(newQuote);
    return newQuote;
  };

  const savePackage = (pkg: Package) => {
    setPackages(prev => {
      const existingIndex = prev.findIndex(p => p.id === pkg.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = pkg;
        return updated;
      }
      return [...prev, pkg];
    });
  };

  const deletePackage = (id: string) => {
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  const calculateCosts = (quote: Quote): CostSummary => {
    const totalBalloons = quote.balloons.reduce((sum, b) => sum + ((b.pricePerUnit || 0) * (b.quantity || 0)), 0);
    const totalMaterials = quote.materials.reduce((sum, m) => sum + ((m.costPerUnit || 0) * (m.quantity || 0)), 0);
    const totalLabor = quote.workers.reduce((sum, w) => sum + ((w.hourlyRate || 0) * (w.hours || 0)), 0);
    const totalTime = quote.timePhases.reduce((sum, t) => sum + ((t.rate || 0) * (t.hours || 0)), 0);
    const totalExtras = quote.extras.reduce((sum, e) => sum + (e.cost || 0), 0);
    const totalTransport = quote.transportCost || 0;
    
    // Calculate tool amortization per event
    const totalToolAmortization = toolAmortization.reduce((sum, tool) => {
      if (!tool.cost || tool.recommendedUses === 0) return sum;
      return sum + (tool.cost / tool.recommendedUses);
    }, 0);
    
    const totalCost = totalBalloons + totalMaterials + totalLabor + totalTime + totalExtras + totalTransport + totalToolAmortization;
    const finalPrice = totalCost * (1 + (quote.marginPercentage || 0) / 100);
    const netProfit = finalPrice - totalCost;
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    const totalHours = quote.timePhases.reduce((sum, t) => sum + (t.hours || 0), 0) + 
                       quote.workers.reduce((sum, w) => sum + (w.hours || 0), 0);
    const profitPerHour = totalHours > 0 ? netProfit / totalHours : 0;

    return {
      totalBalloons,
      totalMaterials,
      totalLabor,
      totalTime,
      totalExtras,
      totalTransport,
      totalToolAmortization,
      totalCost,
      finalPrice,
      netProfit,
      profitPercentage,
      profitPerHour,
    };
  };

  return (
    <QuoteContext.Provider value={{
      currentQuote,
      setCurrentQuote,
      quotes,
      saveQuote,
      deleteQuote,
      duplicateQuote,
      packages,
      savePackage,
      deletePackage,
      toolAmortization,
      setToolAmortization,
      calculateCosts,
      defaultHourlyRate,
      setDefaultHourlyRate,
    }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
}
