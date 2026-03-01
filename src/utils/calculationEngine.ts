import type { PortfolioSnapshot, StockData, YearMetrics, CalculationResult, StockBreakdown } from '../types';

/**
 * Calculation Engine - Computes portfolio-weighted P/E and EPS growth
 * This is the core mathematical logic of the application
 */

/**
 * Calculate portfolio metrics for a single snapshot year
 */
const calculateYearMetrics = (
  snapshot: PortfolioSnapshot,
  stockDataMap: Map<string, StockData>,
  year: number
): {
  portfolioValue: number;
  portfolioEarnings: number;
  stockBreakdowns: StockBreakdown[];
} => {
  let totalValue = 0;
  let totalEarnings = 0;
  const stockBreakdowns: StockBreakdown[] = [];
  
  // Iterate through each holding in the portfolio
  Object.entries(snapshot.holdings).forEach(([symbol, quantity]) => {
    const stockData = stockDataMap.get(symbol);
    if (!stockData) {
      console.warn(`No data available for ${symbol}`);
      return;
    }
    
    // Get year-end price for this stock
    const price = stockData.prices[snapshot.date];
    if (!price) {
      console.warn(`No price data for ${symbol} on ${snapshot.date}`);
      return;
    }
    
    // Get annual EPS for this stock
    const earningsData = stockData.annualEarnings.find(e => e.fiscalYear === year);
    if (!earningsData) {
      console.warn(`No earnings data for ${symbol} in ${year}`);
      return;
    }
    
    const eps = earningsData.reportedEPS;
    
    // Calculate this stock's contribution to portfolio
    const marketValue = quantity * price;
    const stockEarnings = quantity * eps;
    const stockPE = eps > 0 ? price / eps : 0;
    
    totalValue += marketValue;
    totalEarnings += stockEarnings;
    
    // Store breakdown (weight will be calculated after we know totalValue)
    stockBreakdowns.push({
      symbol,
      quantity,
      price,
      marketValue,
      weight: 0, // Will be calculated below
      eps,
      stockEarnings,
      stockPE,
      epsGrowth: null // Will be calculated in main function
    });
  });
  
  // Calculate weights now that we know totalValue
  stockBreakdowns.forEach(breakdown => {
    breakdown.weight = totalValue > 0 ? (breakdown.marketValue / totalValue) * 100 : 0;
  });
  
  // Sort by weight descending
  stockBreakdowns.sort((a, b) => b.weight - a.weight);
  
  return {
    portfolioValue: totalValue,
    portfolioEarnings: totalEarnings,
    stockBreakdowns
  };
};

/**
 * Main calculation function - processes all snapshots and returns complete results
 */
export const calculatePortfolioMetrics = (
  snapshots: PortfolioSnapshot[],
  stockDataMap: Map<string, StockData>
): CalculationResult => {
  const yearMetrics: YearMetrics[] = [];
  let previousEarnings: number | null = null;
  
  // Process each year snapshot
  for (const snapshot of snapshots) {
    const year = parseInt(snapshot.date.split('-')[0]);
    
    const { portfolioValue, portfolioEarnings, stockBreakdowns } = calculateYearMetrics(
      snapshot,
      stockDataMap,
      year
    );
    
    // Calculate per-stock EPS growth by looking up previous year's EPS from stock data
    stockBreakdowns.forEach(breakdown => {
      const stockData = stockDataMap.get(breakdown.symbol);
      if (stockData) {
        // Find EPS for current year and previous year
        const currentEarnings = stockData.annualEarnings.find(e => e.fiscalYear === year);
        const previousEarnings = stockData.annualEarnings.find(e => e.fiscalYear === year - 1);
        
        if (currentEarnings && previousEarnings && previousEarnings.reportedEPS > 0) {
          breakdown.epsGrowth = ((currentEarnings.reportedEPS - previousEarnings.reportedEPS) / previousEarnings.reportedEPS) * 100;
        } else {
          breakdown.epsGrowth = null;
        }
      } else {
        breakdown.epsGrowth = null;
      }
    });
    
    // Calculate portfolio-weighted P/E ratio
    // This is NOT an average - it's Total Market Value / Total Earnings
    const portfolioPE = portfolioEarnings > 0 
      ? portfolioValue / portfolioEarnings 
      : 0;
    
    // Calculate EPS growth compared to previous year
    let epsGrowth: number | null = null;
    if (previousEarnings !== null && previousEarnings > 0) {
      epsGrowth = ((portfolioEarnings - previousEarnings) / previousEarnings) * 100;
    }
    
    yearMetrics.push({
      year,
      portfolioValue,
      portfolioEarnings,
      portfolioPE,
      epsGrowth,
      stockBreakdowns
    });
    
    previousEarnings = portfolioEarnings;
  }
  
  // Extract arrays for charting
  const portfolioPE = yearMetrics.map(m => m.portfolioPE);
  const epsGrowth = yearMetrics.map(m => m.epsGrowth);
  const years = yearMetrics.map(m => m.year);
  
  return {
    yearMetrics,
    portfolioPE,
    epsGrowth,
    years
  };
};

/**
 * Format number as currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format number as percentage
 */
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

/**
 * Format P/E ratio
 */
export const formatPE = (value: number): string => {
  return value.toFixed(2);
};

