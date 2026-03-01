import type { FidelityTransaction, PortfolioSnapshot } from '../types';

/**
 * Reconstructs portfolio holdings at specific snapshot dates
 * This is the "time-travel" engine that replays all transactions
 * up to each snapshot date to determine exact holdings
 */

const SNAPSHOT_DATES = [
  '2020-12-31',
  '2021-12-31',
  '2022-12-31',
  '2023-12-31',
  '2024-12-31',
  '2025-12-31'
];

// Alternative: Use only years with data (uncomment if you want to skip empty years)
// const SNAPSHOT_DATES = [
//   '2023-12-31',
//   '2024-12-31',
//   '2025-12-31'
// ];

/**
 * Calculate holdings at a specific date by replaying all transactions before that date
 */
const calculateHoldingsAtDate = (
  transactions: FidelityTransaction[],
  targetDate: string
): { [symbol: string]: number } => {
  const holdings: { [symbol: string]: number } = {};
  let processedCount = 0;
  
  console.log(`[calculateHoldingsAtDate] Calculating for ${targetDate}, scanning ${transactions.length} transactions`);
  
  for (const transaction of transactions) {
    // Only process transactions on or before target date
    if (transaction.date > targetDate) {
      break; // Since transactions are sorted, we can stop here
    }
    
    const { symbol, action, quantity } = transaction;
    
    // Skip if no symbol (like cash transfers)
    if (!symbol) continue;
    
    // Initialize if not exists
    if (!holdings[symbol]) {
      holdings[symbol] = 0;
    }
    
    // Handle different action types
    if (action.includes('BUY') || action.includes('BOUGHT') || action.includes('PURCHASE') || action.includes('TRANSFERRED FROM')) {
      holdings[symbol] += quantity;
      processedCount++;
      console.log(`  [${transaction.date}] BUY ${quantity} ${symbol} -> total: ${holdings[symbol]}`);
    } else if (action.includes('SELL') || action.includes('SOLD') || action.includes('SALE')) {
      holdings[symbol] -= quantity;
      processedCount++;
      console.log(`  [${transaction.date}] SELL ${quantity} ${symbol} -> total: ${holdings[symbol]}`);
    } else if (action.includes('SPLIT')) {
      holdings[symbol] *= quantity;
      processedCount++;
      console.log(`  [${transaction.date}] SPLIT ${quantity} ${symbol} -> total: ${holdings[symbol]}`);
    }
  }
  
  console.log(`[calculateHoldingsAtDate] Processed ${processedCount} transactions before ${targetDate}`);
  console.log(`[calculateHoldingsAtDate] Holdings before cleanup:`, Object.keys(holdings).length, holdings);
  
  // Remove zero or negative holdings
  Object.keys(holdings).forEach(symbol => {
    if (holdings[symbol] <= 0) {
      console.log(`  Removing ${symbol}: ${holdings[symbol]} (zero or negative)`);
      delete holdings[symbol];
    }
  });
  
  console.log(`[calculateHoldingsAtDate] Final holdings for ${targetDate}:`, Object.keys(holdings).length, 'symbols:', Object.keys(holdings));
  
  return holdings;
};

/**
 * Main function to reconstruct portfolio at all snapshot dates
 */
export const reconstructPortfolio = (
  transactions: FidelityTransaction[]
): PortfolioSnapshot[] => {
  const snapshots: PortfolioSnapshot[] = [];
  
  // Ensure transactions are sorted by date
  const sortedTransactions = [...transactions].sort((a, b) => 
    a.date.localeCompare(b.date)
  );
  
  for (const snapshotDate of SNAPSHOT_DATES) {
    const holdings = calculateHoldingsAtDate(sortedTransactions, snapshotDate);
    
    snapshots.push({
      date: snapshotDate,
      holdings
    });
  }
  
  return snapshots;
};

/**
 * Get all unique tickers that exist across all snapshots
 */
export const getSnapshotTickers = (snapshots: PortfolioSnapshot[]): string[] => {
  const tickerSet = new Set<string>();
  
  console.log('[getSnapshotTickers] Processing', snapshots.length, 'snapshots');
  
  snapshots.forEach((snapshot, index) => {
    const tickers = Object.keys(snapshot.holdings);
    console.log(`[getSnapshotTickers] Snapshot ${index} (${snapshot.date}):`, tickers.length, 'tickers:', tickers);
    tickers.forEach(ticker => tickerSet.add(ticker));
  });
  
  const result = Array.from(tickerSet).sort();
  console.log('[getSnapshotTickers] Total unique tickers found:', result);
  return result;
};

export { SNAPSHOT_DATES };

