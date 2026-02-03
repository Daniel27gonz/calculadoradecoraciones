export interface Balloon {
  id: string;
  description: string;
  pricePerUnit: number;
  quantity: number;
}

export interface Material {
  id: string;
  name: string;
  costPerUnit: number;
  quantity: number;
}

export interface Worker {
  id: string;
  name: string;
  hourlyRate: number;
  hours: number;
}

export interface TimePhase {
  phase: 'planning' | 'preparation' | 'setup' | 'teardown';
  hours: number;
  rate: number;
}

export interface Extra {
  id: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
}

export interface TransportItem {
  id: string;
  concept: string;
  amountIda: number;
  amountRegreso: number;
}

export interface IndirectExpense {
  id: string;
  description: string;
  monthlyAmount: number;
}

export interface ToolAmortization {
  id: string;
  name: string;
  cost: number;
  recommendedUses: number;
}

export interface ReusableMaterialUsed {
  id: string;
  reusableMaterialId: string;
  name: string;
  costPerUse: number;
  quantity: number;
}

export interface Quote {
  id: string;
  clientName: string;
  clientPhone: string;
  eventDate: string;
  eventType: string;
  createdAt: string;
  updatedAt: string;
  balloons: Balloon[];
  materials: Material[];
  workers: Worker[];
  timePhases: TimePhase[];
  extras: Extra[];
  furnitureItems: FurnitureItem[];
  transportItems: TransportItem[];
  indirectExpenses: IndirectExpense[];
  reusableMaterialsUsed: ReusableMaterialUsed[];
  marginPercentage: number;
  toolWearPercentage: number;
  wastagePercentage: number;
  notes: string;
  // Legacy field for backwards compatibility
  transportCost?: number;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedBalloons: number;
  estimatedMaterials: Material[];
  estimatedHours: number;
  suggestedPrice: number;
}

export interface CostSummary {
  totalBalloons: number;
  totalMaterials: number;
  totalReusableMaterials: number;
  totalLabor: number;
  totalTime: number;
  totalExtras: number;
  totalTransport: number;
  toolWear: number;
  wastage: number;
  totalCost: number;
  finalPrice: number;
  netProfit: number;
  profitPercentage: number;
  profitPerHour: number;
}
