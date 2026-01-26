import { z } from 'zod';

// Validation limits to prevent abuse
const MAX_ITEMS = 100;
const MAX_STRING_LENGTH = 500;
const MAX_NAME_LENGTH = 200;
const MAX_NOTES_LENGTH = 5000;
const MAX_PRICE = 1000000;
const MAX_QUANTITY = 10000;
const MAX_HOURS = 1000;
const MAX_PERCENTAGE = 200;

// Balloon validation schema
export const BalloonSchema = z.object({
  id: z.string().max(100),
  description: z.string().max(MAX_STRING_LENGTH),
  pricePerUnit: z.number().min(0).max(MAX_PRICE),
  quantity: z.number().int().min(0).max(MAX_QUANTITY),
});

// Material validation schema
export const MaterialSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(MAX_NAME_LENGTH),
  costPerUnit: z.number().min(0).max(MAX_PRICE).optional().default(0),
  quantity: z.number().min(0).max(MAX_QUANTITY).optional().default(0),
});

// Worker validation schema
export const WorkerSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(MAX_NAME_LENGTH),
  hourlyRate: z.number().min(0).max(MAX_PRICE),
  hours: z.number().min(0).max(MAX_HOURS),
});

// TimePhase validation schema
export const TimePhaseSchema = z.object({
  phase: z.enum(['planning', 'preparation', 'setup', 'teardown']),
  hours: z.number().min(0).max(MAX_HOURS),
  rate: z.number().min(0).max(MAX_PRICE),
});

// Extra validation schema
export const ExtraSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(MAX_NAME_LENGTH),
  pricePerUnit: z.number().min(0).max(MAX_PRICE),
  quantity: z.number().min(0).max(MAX_QUANTITY),
});

// TransportItem validation schema
export const TransportItemSchema = z.object({
  id: z.string().max(100),
  concept: z.string().max(MAX_NAME_LENGTH),
  amount: z.number().min(0).max(MAX_PRICE),
});

// IndirectExpense validation schema
export const IndirectExpenseSchema = z.object({
  id: z.string().max(100),
  description: z.string().max(MAX_NAME_LENGTH),
  monthlyAmount: z.number().min(0).max(MAX_PRICE),
});

// Full Quote validation schema for database operations
export const QuoteDataSchema = z.object({
  balloons: z.array(BalloonSchema).max(MAX_ITEMS).default([]),
  materials: z.array(MaterialSchema).max(MAX_ITEMS).default([]),
  workers: z.array(WorkerSchema).max(MAX_ITEMS).default([]),
  timePhases: z.array(TimePhaseSchema).max(20).default([]),
  extras: z.array(ExtraSchema).max(MAX_ITEMS).default([]),
  transportItems: z.array(TransportItemSchema).max(MAX_ITEMS).default([]),
  indirectExpenses: z.array(IndirectExpenseSchema).max(MAX_ITEMS).default([]),
  marginPercentage: z.number().min(0).max(MAX_PERCENTAGE).default(30),
  toolWearPercentage: z.number().min(0).max(MAX_PERCENTAGE).default(7),
  wastagePercentage: z.number().min(1).max(10).default(5),
  clientName: z.string().trim().min(1).max(MAX_NAME_LENGTH),
  eventDate: z.string().max(50).optional().nullable(),
  notes: z.string().max(MAX_NOTES_LENGTH).optional().default(''),
});

// Validate quote data before saving
export function validateQuoteData(data: unknown): {
  success: boolean;
  data?: z.infer<typeof QuoteDataSchema>;
  error?: string;
} {
  try {
    const validated = QuoteDataSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const path = firstError.path.join('.');
      return {
        success: false,
        error: `Datos inválidos en ${path}: ${firstError.message}`,
      };
    }
    return { success: false, error: 'Error de validación desconocido' };
  }
}

// Safe parse for loading data from database (handles malformed data gracefully)
export function safeParseQuoteArrayField<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  defaultValue: z.infer<T>[]
): z.infer<T>[] {
  if (!Array.isArray(data)) return defaultValue;
  
  const results: z.infer<T>[] = [];
  
  for (const item of data) {
    const result = schema.safeParse(item);
    if (result.success) {
      results.push(result.data);
    } else {
      console.warn('[Validation] Skipping invalid item:', item, result.error.errors);
    }
  }
  
  return results;
}
