import Papa from 'papaparse';
import type { FidelityTransaction } from '../types';

/**
 * Parses a Fidelity CSV file and extracts transaction data
 * This handles the structure of Fidelity's transaction export
 */
export const parseFidelityCSV = (file: File): Promise<FidelityTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: FidelityTransaction[] = [];
          
          // Fidelity CSV columns may vary, so we'll be flexible
          // Common columns: "Run Date", "Action", "Symbol", "Quantity", "Price"
          // Alternative: "Trade Date", "Transaction", "Stock Symbol", "Shares", "Amount"
          
          for (const row of results.data as any[]) {
            // Extract date - try multiple column names
            const dateStr = row['Run Date'] || row['Trade Date'] || row['Date'];
            if (!dateStr) continue;
            
            // Extract action
            const action = (row['Action'] || row['Transaction'] || '').toUpperCase();
            if (!action) continue;
            
            // Extract symbol
            const symbol = (row['Symbol'] || row['Stock Symbol'] || row['Ticker'] || '').toUpperCase().trim();
            if (!symbol || symbol === 'SPAXX') continue; // Skip money market
            
            // IMPORTANT: Fidelity CSV has columns backwards!
            // "Quantity" column = Price per share
            // "Price ($)" column = Number of shares
            
            // Extract quantity (from Price column)
            let qtyStr = row['Price ($)'] || row['Price'] || '0';
            const quantity = Math.abs(parseFloat(qtyStr.toString().replace(/,/g, '')));
            if (isNaN(quantity) || quantity === 0) continue;
            
            // Extract price (from Quantity column)
            const priceStr = row['Quantity'] || row['Shares'] || row['Qty'] || '0';
            const price = Math.abs(parseFloat(priceStr.toString().replace(/,/g, '')));
            if (isNaN(price)) continue;
            
            // Parse date to ISO format
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;
            
            transactions.push({
              date: date.toISOString().split('T')[0], // YYYY-MM-DD
              action,
              symbol,
              quantity,
              price
            });
          }
          
          // Sort by date
          transactions.sort((a, b) => a.date.localeCompare(b.date));
          
          resolve(transactions);
        } catch (error) {
          reject(new Error('Failed to parse CSV: ' + (error as Error).message));
        }
      },
      error: (error) => {
        reject(new Error('CSV parsing error: ' + error.message));
      }
    });
  });
};

/**
 * Extracts unique list of all tickers from transactions
 */
export const extractTickers = (transactions: FidelityTransaction[]): string[] => {
  const tickerSet = new Set<string>();
  transactions.forEach(t => tickerSet.add(t.symbol));
  return Array.from(tickerSet).sort();
};

