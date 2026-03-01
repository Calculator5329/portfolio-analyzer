import type { PortfolioSnapshot, StockData } from '../types';

export interface DailyMetric {
  date: string;
  portfolioValue: number;
  weightedEPS: number;
  portfolioPE: number;
}

interface DailyPrice {
  [ticker: string]: {
    [date: string]: number;
  };
}

/**
 * Parse the daily price CSV data
 */
export function parseDailyPriceCSV(csvText: string): DailyPrice {
  const lines = csvText.trim().split('\n');
  const dailyPrices: DailyPrice = {};
  
  // Skip first line (header)
  if (lines.length < 2) return dailyPrices;
  
  // First line has: META,,GOOGL,,AMZN,,PYPL,,TXRH,
  const headerLine = lines[0];
  const tickers: string[] = [];
  const cols = headerLine.split(',');
  
  for (let i = 0; i < cols.length; i += 2) {
    const ticker = cols[i].trim();
    if (ticker) {
      tickers.push(ticker);
      dailyPrices[ticker] = {};
    }
  }
  
  // Second line has: Date,Close,Date,Close,Date,Close,Date,Close,Date,Close
  // Skip it, we know the structure
  
  // Process data lines (starting from line 3)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    
    // Process each ticker's date/price pair
    for (let j = 0; j < tickers.length; j++) {
      const dateCol = j * 2;
      const priceCol = j * 2 + 1;
      
      if (dateCol < values.length && priceCol < values.length) {
        const dateStr = values[dateCol].trim();
        const priceStr = values[priceCol].trim();
        
        if (dateStr && priceStr) {
          // Parse date from "M/D/YYYY HH:MM:SS" format
          const dateParts = dateStr.split(' ')[0].split('/');
          if (dateParts.length === 3) {
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            const year = dateParts[2];
            const isoDate = `${year}-${month}-${day}`;
            
            const price = parseFloat(priceStr);
            if (!isNaN(price)) {
              dailyPrices[tickers[j]][isoDate] = price;
            }
          }
        }
      }
    }
  }
  
  return dailyPrices;
}

/**
 * Calculate daily portfolio metrics for a given year
 */
export function calculateDailyMetrics(
  yearStartSnapshot: PortfolioSnapshot,
  _yearEndSnapshot: PortfolioSnapshot, // Reserved for future use
  stockDataMap: Map<string, StockData>,
  dailyPrices: DailyPrice,
  targetYear: number
): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  
  // Get the holdings (shares) from the year-start snapshot
  // We use the previous year's end holdings as the starting point
  const holdings = yearStartSnapshot.holdings;
  
  // Filter holdings to only include stocks that have daily price data available
  const trackableHoldings: { [ticker: string]: number } = {};
  for (const [ticker, shares] of Object.entries(holdings)) {
    if (dailyPrices[ticker]) {
      trackableHoldings[ticker] = shares;
    }
  }
  
  console.log(`[DailyMetrics] Year ${targetYear}: Tracking ${Object.keys(trackableHoldings).length} stocks:`, Object.keys(trackableHoldings));
  
  // Get all dates for this year from the daily price data
  const allDates = new Set<string>();
  for (const ticker in dailyPrices) {
    for (const date in dailyPrices[ticker]) {
      if (date.startsWith(targetYear.toString())) {
        allDates.add(date);
      }
    }
  }
  
  const sortedDates = Array.from(allDates).sort();
  
  // Helper function to get interpolated EPS for a given date
  const getInterpolatedEPS = (ticker: string, date: string): number | null => {
    const stockData = stockDataMap.get(ticker);
    if (!stockData) return null;
    
    const currentYearEarnings = stockData.annualEarnings.find(e => e.fiscalYear === targetYear);
    const previousYearEarnings = stockData.annualEarnings.find(e => e.fiscalYear === targetYear - 1);
    
    if (!currentYearEarnings) return null;
    
    // If no previous year data, use current year EPS
    if (!previousYearEarnings) {
      return currentYearEarnings.reportedEPS;
    }
    
    // Calculate progress through the year (0.0 to 1.0)
    const yearStart = new Date(`${targetYear}-01-01`);
    const yearEnd = new Date(`${targetYear}-12-31`);
    const currentDate = new Date(date);
    
    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (currentDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
    const progress = Math.max(0, Math.min(1, daysElapsed / totalDays));
    
    // Linear interpolation: EPS = prevEPS + (currEPS - prevEPS) * progress
    const prevEPS = previousYearEarnings.reportedEPS;
    const currEPS = currentYearEarnings.reportedEPS;
    const interpolatedEPS = prevEPS + (currEPS - prevEPS) * progress;
    
    return interpolatedEPS;
  };
  
  // For each date, calculate portfolio metrics
  for (const date of sortedDates) {
    // First, check if ALL trackable stocks have price data for this date
    let hasCompleteData = true;
    for (const ticker of Object.keys(trackableHoldings)) {
      const price = dailyPrices[ticker]?.[date];
      if (!price || price <= 0) {
        hasCompleteData = false;
        break;
      }
    }
    
    // Skip this day if any tracked stock is missing price data
    if (!hasCompleteData) {
      continue;
    }
    
    let totalMarketValue = 0;
    let totalEarnings = 0;
    let totalShares = 0;
    
    // Calculate market value and earnings for each trackable holding
    for (const [ticker, shares] of Object.entries(trackableHoldings)) {
      // Get daily price for this ticker on this date
      const price = dailyPrices[ticker][date]; // Safe to access now
      
      // Get interpolated EPS for this date (smoothly transitions throughout the year)
      const eps = getInterpolatedEPS(ticker, date);
      if (eps === null) continue;
      
      // Calculate market value and earnings for this stock
      const marketValue = shares * price;
      const earnings = shares * eps;
      
      totalMarketValue += marketValue;
      totalEarnings += earnings;
      totalShares += shares;
    }
    
    // Calculate weighted EPS and P/E
    if (totalMarketValue > 0 && totalEarnings > 0 && totalShares > 0) {
      const weightedEPS = totalEarnings / totalShares;
      const portfolioPE = totalMarketValue / totalEarnings;
      
      metrics.push({
        date,
        portfolioValue: totalMarketValue,
        weightedEPS: weightedEPS,
        portfolioPE: portfolioPE
      });
    }
  }
  
  console.log(`[DailyMetrics] Year ${targetYear}: Generated ${metrics.length} daily metrics from ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);
  
  // Log example interpolation for first tracked stock
  if (Object.keys(trackableHoldings).length > 0 && metrics.length > 0) {
    const firstTicker = Object.keys(trackableHoldings)[0];
    const firstDate = metrics[0].date;
    const lastDate = metrics[metrics.length - 1].date;
    const firstEPS = getInterpolatedEPS(firstTicker, firstDate);
    const lastEPS = getInterpolatedEPS(firstTicker, lastDate);
    console.log(`[DailyMetrics] ${firstTicker} EPS interpolation: ${firstDate}: $${firstEPS?.toFixed(2)} → ${lastDate}: $${lastEPS?.toFixed(2)}`);
  }
  
  return metrics;
}

