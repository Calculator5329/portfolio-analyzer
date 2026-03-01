import type { AnnualEarnings, StockData } from '../types';

/**
 * Alpha Vantage API integration
 * Fetches historical EPS and price data for stocks
 */

const API_BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hardcoded stock data as fallback when API is not available
 */
const HARDCODED_STOCK_DATA: { [symbol: string]: { eps: { [year: string]: number }, prices: { [year: string]: number } } } = {
  'META': {
    eps: { '2020': 10.22, '2021': 13.99, '2022': 8.63, '2023': 15.19, '2024': 24.61, '2025': 29.00 },
    prices: { '2020': 273.16, '2021': 336.35, '2022': 124.74, '2023': 346.29, '2024': 585.51, '2025': 609.46 }
  },
  'GOOGL': {
    eps: { '2020': 2.93, '2021': 5.61, '2022': 4.56, '2023': 5.80, '2024': 8.04, '2025': 10.52 },
    prices: { '2020': 87.63, '2021': 144.85, '2022': 89.12, '2023': 138.17, '2024': 189.30, '2025': 276.41 }
  },
  'AMZN': {
    eps: { '2020': 2.09, '2021': 3.24, '2022': -0.27, '2023': 2.90, '2024': 5.53, '2025': 7.80 },
    prices: { '2020': 162.85, '2021': 166.72, '2022': 85.82, '2023': 149.93, '2024': 219.39, '2025': 234.69 }
  },
  'PYPL': {
    eps: { '2020': 3.54, '2021': 3.52, '2022': 2.09, '2023': 3.84, '2024': 3.99, '2025': 5.11 },
    prices: { '2020': 234.20, '2021': 188.58, '2022': 74.58, '2023': 61.46, '2024': 85.35, '2025': 62.81 }
  },
  'TXRH': {
    eps: { '2020': 0.45, '2021': 3.50, '2022': 3.97, '2023': 4.54, '2024': 6.47, '2025': 6.37 },
    prices: { '2020': 78.16, '2021': 89.28, '2022': 93.20, '2023': 119.29, '2024': 180.43, '2025': 167.35 }
  }
};

/**
 * Use hardcoded data instead of API calls
 */
const useHardcodedData = (symbol: string): StockData | null => {
  const data = HARDCODED_STOCK_DATA[symbol];
  if (!data) {
    console.warn(`[HARDCODED] No data available for ${symbol}`);
    return null;
  }

  const annualEarnings: AnnualEarnings[] = [];
  const prices: { [date: string]: number } = {};

  // Convert hardcoded data to expected format
  Object.keys(data.eps).forEach(year => {
    annualEarnings.push({
      fiscalYear: parseInt(year),
      reportedEPS: data.eps[year]
    });
    prices[`${year}-12-31`] = data.prices[year];
  });

  console.log(`[HARDCODED] ✓ Using hardcoded data for ${symbol}: ${annualEarnings.length} years`);

  return {
    symbol,
    annualEarnings,
    prices
  };
};

/**
 * Fetch annual earnings (EPS) data for a symbol
 * NOTE: Currently unused - using hardcoded data instead
 * @deprecated
 */
const _fetchEarnings = async (
  symbol: string,
  apiKey: string
): Promise<AnnualEarnings[]> => {
  const url = `${API_BASE_URL}?function=EARNINGS&symbol=${symbol}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || 'API rate limit reached');
    }
    
    if (!data.annualEarnings) {
      throw new Error('No earnings data available');
    }
    
    // Parse annual earnings
    const earnings: AnnualEarnings[] = data.annualEarnings.map((item: any) => ({
      fiscalYear: parseInt(item.fiscalDateEnding.split('-')[0]),
      reportedEPS: parseFloat(item.reportedEPS) || 0
    }));
    
    return earnings;
  } catch (error) {
    console.error(`Error fetching earnings for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetch historical daily prices for a symbol
 * We need year-end prices (12/31) for each year
 * NOTE: Currently unused - using hardcoded data instead
 * @deprecated
 */
const _fetchHistoricalPrices = async (
  symbol: string,
  apiKey: string
): Promise<{ [date: string]: number }> => {
  const url = `${API_BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`[API] Price response for ${symbol}:`, Object.keys(data));
    
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    if (data['Note']) {
      console.warn(`[API] Rate limit warning for ${symbol}:`, data['Note']);
      throw new Error('API rate limit reached - please wait and try again');
    }
    
    if (data['Information']) {
      console.warn(`[API] API message for ${symbol}:`, data['Information']);
      throw new Error('API limit reached - too many requests');
    }
    
    if (!data['Time Series (Daily)']) {
      console.error(`[API] ❌ No "Time Series (Daily)" in response for ${symbol}. Available keys:`, Object.keys(data));
      throw new Error(`No price data available for ${symbol}`);
    }
    
    const timeSeries = data['Time Series (Daily)'];
    const prices: { [date: string]: number } = {};
    
    // Convert to our format: date -> closing price
    Object.keys(timeSeries).forEach(date => {
      prices[date] = parseFloat(timeSeries[date]['5. adjusted close']);
    });
    
    console.log(`[API] ✓ Fetched ${Object.keys(prices).length} price points for ${symbol}`);
    return prices;
  } catch (error) {
    console.error(`Error fetching prices for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Find the closest available price to a target date
 * This handles weekends and holidays where markets are closed
 * NOTE: Currently unused - using hardcoded data instead
 * @deprecated
 */
const _findClosestPrice = (
  prices: { [date: string]: number },
  targetDate: string
): number | null => {
  // Try exact date first
  if (prices[targetDate]) {
    return prices[targetDate];
  }
  
  // Look backwards up to 5 days for the closest trading day
  const target = new Date(targetDate);
  for (let i = 1; i <= 5; i++) {
    const checkDate = new Date(target);
    checkDate.setDate(checkDate.getDate() - i);
    const checkDateStr = checkDate.toISOString().split('T')[0];
    
    if (prices[checkDateStr]) {
      return prices[checkDateStr];
    }
  }
  
  return null;
};

/**
 * Fetch complete stock data (earnings + prices) for a single symbol
 */
export const fetchStockData = async (
  symbol: string,
  _apiKey: string, // Unused when using hardcoded data
  onProgress?: (message: string) => void
): Promise<StockData> => {
  console.log(`[API] Starting fetch for ${symbol}...`);
  
  // Only use hardcoded data (skip API calls entirely)
  const hardcodedData = useHardcodedData(symbol);
  if (hardcodedData) {
    onProgress?.(`Using hardcoded data for ${symbol}...`);
    await delay(100); // Small delay for UI responsiveness
    return hardcodedData;
  }
  
  // No hardcoded data available - skip this stock
  console.warn(`[API] ⚠️ No hardcoded data for ${symbol}, skipping...`);
  throw new Error(`No data available for ${symbol}`);
};

/**
 * Fetch data for multiple symbols with progress tracking
 */
export const fetchAllStockData = async (
  symbols: string[],
  apiKey: string,
  onProgress: (current: number, total: number, message: string) => void
): Promise<Map<string, StockData>> => {
  const stockDataMap = new Map<string, StockData>();
  
  console.log(`[API] Starting to fetch data for ${symbols.length} stocks:`, symbols);
  console.log(`[API] Using hardcoded data only (API disabled)`);
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    
    try {
      console.log(`\n[API] === Processing ${i + 1}/${symbols.length}: ${symbol} ===`);
      onProgress(i + 1, symbols.length, `Checking data for ${symbol}... (${i + 1}/${symbols.length})`);
      
      const stockData = await fetchStockData(
        symbol,
        apiKey,
        (msg) => onProgress(i + 1, symbols.length, msg)
      );
      
      stockDataMap.set(symbol, stockData);
      console.log(`[API] ✓ Successfully stored data for ${symbol}`);
    } catch (error) {
      console.warn(`[API] ⚠️ Skipping ${symbol}: No hardcoded data available`);
      // Continue with other symbols even if one fails
    }
  }
  
  console.log(`\n[API] ✓ Completed fetching data for ${stockDataMap.size}/${symbols.length} stocks`);
  return stockDataMap;
};

