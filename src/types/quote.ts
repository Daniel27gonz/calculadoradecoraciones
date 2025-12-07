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
  cost: number;
}

export interface ToolAmortization {
  id: string;
  name: string;
  cost: number;
  recommendedUses: number;
}

export interface Quote {
  id: string;
  clientName: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  balloons: Balloon[];
  materials: Material[];
  workers: Worker[];
  timePhases: TimePhase[];
  extras: Extra[];
  marginPercentage: number;
  notes: string;
  transportCost: number;
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
  totalLabor: number;
  totalTime: number;
  totalExtras: number;
  totalTransport: number;
  totalToolAmortization: number;
  totalCost: number;
  finalPrice: number;
  netProfit: number;
  profitPercentage: number;
  profitPerHour: number;
}
