import { useState, useEffect } from 'react';
import './App.css';
import { ProgressIndicator } from './components/ProgressIndicator';
import { ResultsView } from './components/ResultsView';
import type { CalculationResult, PortfolioSnapshot, StockData } from './types';
import { parseFidelityCSV } from './utils/csvParser';
import { reconstructPortfolio, getSnapshotTickers } from './utils/portfolioReconstructor';
import { fetchAllStockData } from './utils/alphaVantageAPI';
import { calculatePortfolioMetrics } from './utils/calculationEngine';

type AppStep = 'processing' | 'results';

function App() {
  const [step, setStep] = useState<AppStep>('processing');
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [portfolioSnapshots, setPortfolioSnapshots] = useState<PortfolioSnapshot[]>([]);
  const [stockDataMap, setStockDataMap] = useState<Map<string, StockData>>(new Map());
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-start analysis on mount
  useEffect(() => {
    const startAnalysis = async () => {
      console.log('=== STARTING PORTFOLIO ANALYSIS ===');
      
      setStep('processing');
      setError(null);
      
      try {
        // Step 0: Load CSV from public folder
        console.log('[STEP 0] Loading CSV from public folder...');
        setProgressMessage('Loading transaction history...');
        setProgress(0);
        setTotal(5);
        
        const response = await fetch('/my-combined-history.csv');
        if (!response.ok) {
          throw new Error('Failed to load CSV file from public folder');
        }
        const blob = await response.blob();
        const file = new File([blob], 'my-combined-history.csv', { type: 'text/csv' });
        
        const transactions = await parseFidelityCSV(file);
        console.log('Transactions loaded:', transactions.length);
        
        if (transactions.length === 0) {
          throw new Error('No valid transactions found in CSV file');
        }
        
        setProgress(1);
        
        // Step 1: Reconstruct portfolio snapshots
        console.log('[STEP 1] Reconstructing portfolio history...');
        setProgressMessage('Reconstructing portfolio history...');
        
        const snapshots = reconstructPortfolio(transactions);
        console.log('[STEP 1] ✓ Portfolio snapshots created:', snapshots);
        setPortfolioSnapshots(snapshots);
        setProgress(2);
        
        // Step 2: Get all unique tickers
        const tickers = getSnapshotTickers(snapshots);
        console.log('[STEP 2] Found unique tickers:', tickers);
        
        if (tickers.length === 0) {
          throw new Error('No holdings found in portfolio snapshots. Check that your CSV has BUY/SELL transactions.');
        }
        
        console.log(`[STEP 2] ✓ Found ${tickers.length} unique tickers to analyze`);
        setProgress(3);
        setProgressMessage(`Found ${tickers.length} unique tickers. Fetching hardcoded data...`);
        
        // Step 3: Fetch stock data (using hardcoded data)
        console.log('[STEP 3] Fetching stock data (using hardcoded data)...');
        setTotal(tickers.length + 3);
        
        const dataMap = await fetchAllStockData(
          tickers,
          'dummy-api-key', // Not used since all data is hardcoded
          (current, total, message) => {
            console.log(`[PROGRESS] ${current}/${total}: ${message}`);
            setProgress(current + 3);
            setTotal(total + 3);
            setProgressMessage(message);
          }
        );
        
        console.log('[STEP 3] ✓ Stock data fetching complete');
        console.log(`[STEP 3] Successfully loaded data for ${dataMap.size} out of ${tickers.length} stocks`);
        
        if (dataMap.size === 0) {
          throw new Error('No stock data available. Please add hardcoded data for your stocks.');
        }
        
        setStockDataMap(dataMap);
        
        // Step 4: Calculate metrics
        console.log('[STEP 4] Calculating portfolio metrics...');
        setProgressMessage('Calculating portfolio metrics...');
        setProgress(tickers.length + 3);
        
        const calculationResults = calculatePortfolioMetrics(snapshots, dataMap);
        console.log('[STEP 4] ✓ Calculation results:', calculationResults);
        setResults(calculationResults);
        
        // Move to results view
        console.log('=== ANALYSIS COMPLETE ===');
        setStep('results');
      } catch (err) {
        console.error('=== ERROR DURING ANALYSIS ===', err);
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        
        // Show a more helpful error in the console
        console.error('Full error details:', err);
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Check that the CSV file is in the public folder');
        console.log('2. Verify you have hardcoded data for your stocks');
        console.log('3. Check the browser console for detailed error messages\n');
      }
    };
    
    startAnalysis();
  }, []); // Empty dependency array = run once on mount

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 Historical Portfolio P/E & EPS Growth Analyzer</h1>
        <p className="subtitle">
          Time-travel through your portfolio to visualize historical valuation and earnings growth
        </p>
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '1rem', fontSize: '0.9em' }}>
              Check the browser console for more details.
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="step-container">
            <ProgressIndicator
              step="processing"
              progress={progress}
              total={total}
              message={progressMessage}
            />
            <p className="info-text">
              Analyzing your portfolio data...
            </p>
          </div>
        )}

        {step === 'results' && results && (
          <ResultsView 
            results={results} 
            onReset={handleReset} 
            portfolioSnapshots={portfolioSnapshots}
            stockDataMap={stockDataMap}
          />
        )}
      </main>

      <footer className="App-footer">
        <p>
          Built with React + TypeScript | Historical EPS & Price Data Analysis
        </p>
      </footer>
    </div>
  );
}

export default App;
