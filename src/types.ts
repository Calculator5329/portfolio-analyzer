// Transaction types from Fidelity CSV
export interface FidelityTransaction {
  date: string; // ISO date string
  action: string; // BUY, SELL, STOCK SPLIT, etc.
  symbol: string;
  quantity: number;
  price: number;
}

// Portfolio snapshot at a specific date
export interface PortfolioSnapshot {
  date: string;
  holdings: { [symbol: string]: number }; // symbol -> quantity
}

// API data structures
export interface AnnualEarnings {
  fiscalYear: number;
  reportedEPS: number;
}

export interface StockPrice {
  date: string;
  close: number;
}

export interface StockData {
  symbol: string;
  annualEarnings: AnnualEarnings[];
  prices: { [date: string]: number }; // date -> closing price
}

// Stock-level breakdown for a given year
export interface StockBreakdown {
  symbol: string;
  quantity: number;
  price: number;
  marketValue: number;
  weight: number; // percentage of portfolio (0-100)
  eps: number;
  stockEarnings: number;
  stockPE: number;
  epsGrowth: number | null; // YoY EPS growth for this stock
}

// Calculation results
export interface YearMetrics {
  year: number;
  portfolioValue: number;
  portfolioEarnings: number;
  portfolioPE: number;
  epsGrowth: number | null; // null for first year
  stockBreakdowns?: StockBreakdown[]; // detailed per-stock data
}

export interface CalculationResult {
  yearMetrics: YearMetrics[];
  portfolioPE: number[];
  epsGrowth: (number | null)[];
  years: number[];
}

// UI State
export interface AppState {
  step: 'upload' | 'parsing' | 'reconstructing' | 'fetching' | 'calculating' | 'visualizing';
  progress: number;
  error: string | null;
}

