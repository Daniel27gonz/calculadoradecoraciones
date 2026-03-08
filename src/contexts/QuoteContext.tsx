import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Quote, Package, Balloon, Material, Worker, TimePhase, Extra, FurnitureItem, CostSummary, TransportItem, IndirectExpense, ReusableMaterialUsed } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  validateQuoteData, 
  safeParseQuoteArrayField,
  BalloonSchema,
  MaterialSchema,
  WorkerSchema,
  TimePhaseSchema,
  ExtraSchema,
  FurnitureItemSchema,
  TransportItemSchema,
  IndirectExpenseSchema,
  ReusableMaterialUsedSchema
} from '@/lib/validations/quote';

interface QuoteContextType {
  // Current quote being edited
  currentQuote: Quote | null;
  setCurrentQuote: (quote: Quote | null) => void;
  
  // Saved quotes
  quotes: Quote[];
  saveQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  duplicateQuote: (id: string) => Quote;
  loadQuotes: () => Promise<void>;
  
  // Packages
  packages: Package[];
  savePackage: (pkg: Package) => void;
  deletePackage: (id: string) => void;
  
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

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(25);
  const [indirectExpensesMonthlyTotal, setIndirectExpensesMonthlyTotal] = useState<number>(0);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Load indirect expenses from database (latest month with data)
  const loadIndirectExpenses = useCallback(async () => {
    if (!user) {
      setIndirectExpensesMonthlyTotal(0);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('indirect_expenses')
        .select('monthly_amount, payment_date')
        .eq('user_id', user.id);
      if (error) throw error;
      const withDates = (data || []).filter(e => e.payment_date);
      if (withDates.length === 0) {
        setIndirectExpensesMonthlyTotal(0);
        return;
      }
      let latestY = 0, latestM = 0;
      withDates.forEach(e => {
        const [y, m] = e.payment_date!.split('-');
        const yr = parseInt(y), mo = parseInt(m);
        if (yr > latestY || (yr === latestY && mo > latestM)) {
          latestY = yr;
          latestM = mo;
        }
      });
      const total = withDates
        .filter(e => {
          const [y, m] = e.payment_date!.split('-');
          return parseInt(y) === latestY && parseInt(m) === latestM;
        })
        .reduce((sum, e) => sum + (Number(e.monthly_amount) || 0), 0);
      setIndirectExpensesMonthlyTotal(total);
    } catch (err) {
      console.error('Error loading indirect expenses:', err);
    }
  }, [user]);

  // Load quotes from Supabase when user logs in
  const loadQuotes = async () => {
    if (!user) {
      setQuotes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const loadedQuotes: Quote[] = data.map((q: any) => ({
          id: q.id,
          folio: q.folio || undefined,
          clientName: q.client_name || '',
          clientPhone: q.client_phone || '',
          eventDate: q.event_date || '',
          eventType: q.event_type || '',
          setupTime: q.setup_time || '',
          decorationDescription: q.decoration_description || '',
          createdAt: q.created_at,
          updatedAt: q.updated_at,
          // Use safe parsing for JSONB fields to handle malformed data
          balloons: safeParseQuoteArrayField(q.balloons, BalloonSchema, []) as Balloon[],
          materials: safeParseQuoteArrayField(q.materials, MaterialSchema, []) as Material[],
          workers: safeParseQuoteArrayField(q.workers, WorkerSchema, []) as Worker[],
          timePhases: safeParseQuoteArrayField(q.time_phases, TimePhaseSchema, []) as TimePhase[],
          extras: safeParseQuoteArrayField(q.extras, ExtraSchema, []) as Extra[],
          furnitureItems: safeParseQuoteArrayField(q.furniture_items, FurnitureItemSchema, []) as FurnitureItem[],
          transportItems: safeParseQuoteArrayField(q.transport_items, TransportItemSchema, []) as TransportItem[],
          indirectExpenses: [] as IndirectExpense[], // Column doesn't exist yet in DB
          reusableMaterialsUsed: safeParseQuoteArrayField(q.reusable_materials_used, ReusableMaterialUsedSchema, []) as ReusableMaterialUsed[],
          marginPercentage: typeof q.margin_percentage === 'number' ? q.margin_percentage : 30,
          toolWearPercentage: typeof q.tool_wear_percentage === 'number' ? q.tool_wear_percentage : 7,
          wastagePercentage: typeof q.wastage_percentage === 'number' ? q.wastage_percentage : 5,
          notes: q.notes || '',
          status: (q.status === 'approved' ? 'approved' : q.status === 'delivered' ? 'delivered' : q.status === 'cancelled' ? 'cancelled' : 'pending') as 'pending' | 'approved' | 'delivered' | 'cancelled',
        }));
        setQuotes(loadedQuotes);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadQuotes();
      loadIndirectExpenses();
    }
  }, [user, loadIndirectExpenses]);

  // Use profile's hourly rate if available
  useEffect(() => {
    if (profile?.default_hourly_rate) {
      setDefaultHourlyRate(profile.default_hourly_rate);
    }
  }, [profile]);

  // Recalculate stock deductions for an order (delete old, insert new)
  const recalculateStockDeductions = async (quote: Quote) => {
    if (!user) return;
    try {
      // Get user materials to match by name
      const { data: userMaterials } = await supabase
        .from('user_materials')
        .select('id, name')
        .eq('user_id', user.id);

      if (!userMaterials) return;

      // Delete existing deductions for this quote
      await supabase.from('stock_deductions').delete().eq('quote_id', quote.id).eq('user_id', user.id);

      // Aggregate quantities by material_id
      const aggregated: Record<string, number> = {};

      for (const qMat of quote.materials) {
        const match = userMaterials.find(m => m.name.toLowerCase() === qMat.name.toLowerCase());
        if (match && qMat.quantity > 0) {
          aggregated[match.id] = (aggregated[match.id] || 0) + qMat.quantity;
        }
      }

      for (const balloon of quote.balloons) {
        const match = userMaterials.find(m => m.name.toLowerCase() === balloon.description.toLowerCase());
        if (match && balloon.quantity > 0) {
          aggregated[match.id] = (aggregated[match.id] || 0) + balloon.quantity;
        }
      }

      const deductions = Object.entries(aggregated).map(([material_id, quantity_deducted]) => ({
        material_id,
        quantity_deducted,
        quote_id: quote.id,
        user_id: user.id,
      }));

      if (deductions.length > 0) {
        await supabase.from('stock_deductions').insert(deductions);
      }
    } catch (err) {
      console.error('Error recalculating stock deductions:', err);
    }
  };

  const saveQuote = async (quote: Quote) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar cotizaciones",
        variant: "destructive",
      });
      return;
    }

    // Validate quote data before saving
    const validation = validateQuoteData({
      clientName: quote.clientName,
      eventDate: quote.eventDate,
      balloons: quote.balloons,
      materials: quote.materials,
      workers: quote.workers,
      timePhases: quote.timePhases,
      extras: quote.extras,
      furnitureItems: quote.furnitureItems,
      transportItems: quote.transportItems,
      indirectExpenses: quote.indirectExpenses,
      reusableMaterialsUsed: quote.reusableMaterialsUsed,
      marginPercentage: quote.marginPercentage,
      toolWearPercentage: quote.toolWearPercentage,
      wastagePercentage: quote.wastagePercentage,
      notes: quote.notes,
    });

    if (!validation.success) {
      console.error('[QuoteContext] Validation failed:', validation.error);
      toast({
        title: "Error de validación",
        description: validation.error || "Los datos de la cotización no son válidos",
        variant: "destructive",
      });
      return;
    }

    const validatedData = validation.data!;

    try {
      const dbQuote = {
        id: quote.id,
        user_id: user.id,
        client_name: validatedData.clientName,
        client_phone: quote.clientPhone || null,
        event_date: validatedData.eventDate || null,
        event_type: quote.eventType || null,
        setup_time: quote.setupTime || null,
        decoration_description: quote.decorationDescription || null,
        balloons: validatedData.balloons,
        materials: validatedData.materials,
        workers: validatedData.workers,
        time_phases: validatedData.timePhases,
        extras: validatedData.extras,
        furniture_items: validatedData.furnitureItems,
        transport_items: validatedData.transportItems,
        // indirect_expenses column doesn't exist yet - omitted from save
        reusable_materials_used: validatedData.reusableMaterialsUsed,
        margin_percentage: validatedData.marginPercentage,
        tool_wear_percentage: validatedData.toolWearPercentage,
        wastage_percentage: validatedData.wastagePercentage,
        notes: validatedData.notes,
        status: quote.status || 'pending',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('quotes')
        .upsert(dbQuote, { onConflict: 'id' });

      if (error) throw error;

      // Update local state
      setQuotes(prev => {
        const existingIndex = prev.findIndex(q => q.id === quote.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...quote, updatedAt: new Date().toISOString() };
          return updated;
        }
        return [quote, ...prev];
      });

      // If this quote is an active order (approved/delivered), recalculate stock deductions
      if (quote.status === 'approved' || quote.status === 'delivered') {
        await recalculateStockDeductions(quote);
      } else if (quote.status === 'cancelled' || quote.status === 'pending') {
        // If cancelled or reverted to pending, remove all stock deductions
        await supabase.from('stock_deductions').delete().eq('quote_id', quote.id).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cotización",
        variant: "destructive",
      });
    }
  };

  const deleteQuote = async (id: string) => {
    if (!user) return;

    try {
      // If this was an order, remove stock deductions first
      const quoteToDelete = quotes.find(q => q.id === id);
      if (quoteToDelete && (quoteToDelete.status === 'approved' || quoteToDelete.status === 'delivered')) {
        await supabase.from('stock_deductions').delete().eq('quote_id', id).eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setQuotes(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización",
        variant: "destructive",
      });
    }
  };

  const duplicateQuote = (id: string): Quote => {
    const original = quotes.find(q => q.id === id);
    if (!original) throw new Error('Quote not found');
    
    const newQuote: Quote = {
      ...original,
      id: crypto.randomUUID(),
      folio: undefined,
      clientName: `${original.clientName} (copia)`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
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
    // Calcular cada concepto individualmente
    const totalBalloons = quote.balloons.reduce((sum, b) => sum + ((b.pricePerUnit || 0) * (b.quantity || 0)), 0);
    const totalMaterials = quote.materials.reduce((sum, m) => sum + ((m.costPerUnit || 0) * (m.quantity || 0)), 0);
    
    // Materiales reutilizables
    const totalReusableMaterials = quote.reusableMaterialsUsed?.reduce(
      (sum, m) => sum + ((m.costPerUse || 0) * (m.quantity || 0)), 0
    ) || 0;
    
    // Mano de obra = trabajadores + tiempo por fases
    const laborFromWorkers = quote.workers.reduce((sum, w) => sum + ((w.hourlyRate || 0) * (w.hours || 0)), 0);
    const laborFromPhases = quote.timePhases.reduce((sum, t) => sum + ((t.rate || 0) * (t.hours || 0)), 0);
    const totalLabor = laborFromWorkers + laborFromPhases;
    const totalTime = 0; // Ya incluido en totalLabor para evitar duplicados
    
    const totalExtras = quote.extras.reduce((sum, e) => sum + ((e.pricePerUnit || 0) * (e.quantity || 0)), 0);
    
    // Transporte
    const totalTransport = quote.transportItems?.reduce((sum, t) => sum + (t.amountIda || 0) + (t.amountRegreso || 0), 0) || quote.transportCost || 0;
    
    // Merma: porcentaje sobre el total de materiales (no incluye reutilizables)
    const wastagePercentage = quote.wastagePercentage || 5;
    const wastage = totalMaterials * (wastagePercentage / 100);
    
    // Desgaste de herramientas: deshabilitado (ya no se usa)
    const toolWear = 0;
    
    // Gastos indirectos: cargar desde base de datos y dividir entre eventos por mes
    const eventsPerMonth = profile?.events_per_month || 4;
    const indirectExpenses = eventsPerMonth > 0 ? indirectExpensesMonthlyTotal / eventsPerMonth : 0;
    
    // Total = suma de todos los conceptos que se muestran en la hoja de cotización
    // (Materiales no reutilizables + Materiales reutilizables + Merma + Mano de obra + Transporte + Extras + Gastos indirectos)
    // Nota: totalBalloons no se incluye ya que no se muestra como línea separada
    const totalCost = totalMaterials + totalReusableMaterials + totalLabor + totalTransport + wastage + totalExtras + indirectExpenses;
    
    // Precio final con margen
    const finalPrice = totalCost * (1 + (quote.marginPercentage || 0) / 100);
    const netProfit = finalPrice - totalCost;
    const profitPercentage = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    // Horas totales para calcular ganancia por hora
    const totalHours = quote.timePhases.reduce((sum, t) => sum + (t.hours || 0), 0) + 
                       quote.workers.reduce((sum, w) => sum + (w.hours || 0), 0);
    const profitPerHour = totalHours > 0 ? netProfit / totalHours : 0;

    return {
      totalBalloons,
      totalMaterials,
      totalReusableMaterials,
      totalLabor,
      totalTime,
      totalExtras,
      totalTransport,
      toolWear,
      wastage,
      indirectExpenses,
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
      loadQuotes,
      packages,
      savePackage,
      deletePackage,
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
