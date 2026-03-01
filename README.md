# 📊 Historical Portfolio P/E & EPS Growth Analyzer

A powerful web application that allows you to "time-travel" through your investment portfolio to analyze historical valuation (P/E ratio) and earnings growth from 2020 to 2025.

## 🌟 Features

- **Portfolio Reconstruction**: Replays your transactions to calculate exact holdings at each year-end
- **Historical Analysis**: Fetches real historical EPS and price data from Alpha Vantage
- **Portfolio-Weighted Metrics**: Calculates true portfolio-weighted P/E ratios (not simple averages)
- **Year-over-Year Growth**: Tracks your portfolio's earnings growth over time
- **Beautiful Visualizations**: Interactive charts using Chart.js
- **100% Client-Side**: All processing happens in your browser - your data never leaves your computer

## 🚀 Getting Started

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Fidelity Transaction CSV**: Export your transaction history from Fidelity
3. **Alpha Vantage API Key**: Get a free API key at [alphavantage.co](https://www.alphavantage.co/support/#api-key)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 📖 How to Use

### Step 1: Export Your Fidelity Transactions

1. Log into your Fidelity account
2. Navigate to "Accounts & Trade" → "Portfolio"
3. Click "Download" and export your transaction history as CSV
4. Make sure it includes at least these columns:
   - Run Date (or Trade Date)
   - Action (BUY/SELL)
   - Symbol
   - Quantity
   - Price

### Step 2: Get Your Alpha Vantage API Key

1. Visit [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Copy your API key

### Step 3: Upload and Analyze

1. Click "Upload Fidelity CSV" and select your transaction file
2. Enter your Alpha Vantage API key
3. Click "Start Analysis"
4. Wait for the data to be fetched (this can take several minutes due to API rate limits)
5. View your results!

## 🧮 How It Works

### The Six Core Modules

1. **File Uploader**: Simple HTML button to upload your CSV
2. **Transaction Parser**: Parses CSV into structured transaction data
3. **Portfolio Reconstruction Engine**: "Time-travels" to calculate holdings at each year-end (2020-2025)
4. **External Data Fetcher**: Calls Alpha Vantage API for historical EPS and prices
5. **Calculation Engine**: Computes portfolio-weighted P/E and EPS growth
6. **Visualization**: Displays results with beautiful Chart.js charts

### Portfolio-Weighted P/E Calculation

The app calculates the **true portfolio-weighted P/E ratio**, not a simple average:

```
Portfolio P/E = Total Portfolio Value / Total Portfolio Earnings

Where:
- Total Portfolio Value = Σ(shares × year-end price) for all stocks
- Total Portfolio Earnings = Σ(shares × annual EPS) for all stocks
```

### EPS Growth Calculation

Year-over-year growth is calculated as:

```
EPS Growth % = ((Current Year Earnings - Previous Year Earnings) / Previous Year Earnings) × 100
```

## ⚠️ Important Notes

### API Rate Limits

Alpha Vantage's free tier allows **5 API calls per minute**. The app automatically:
- Waits 12 seconds between each API call
- Requires 2 calls per stock (earnings + prices)
- Shows progress as it fetches data

**Example timing:**
- 5 stocks = ~2 minutes
- 10 stocks = ~4 minutes
- 20 stocks = ~8 minutes

### Data Availability

- Some stocks may not have complete historical data
- The app will skip stocks where data is unavailable
- Results are only shown for stocks with valid data

### Stock Splits

The app attempts to handle stock splits, but you may need to adjust the CSV parsing logic based on how Fidelity formats split transactions in your specific export.

## 🏗️ Technical Architecture

### Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing-fast development
- **PapaParse** for CSV parsing
- **Chart.js** with react-chartjs-2 for visualizations
- **Alpha Vantage API** for financial data

### Project Structure

```
src/
├── components/           # React components
│   ├── FileUploader.tsx
│   ├── APIKeyInput.tsx
│   ├── ProgressIndicator.tsx
│   └── ResultsView.tsx
├── utils/               # Core logic modules
│   ├── csvParser.ts          # CSV parsing
│   ├── portfolioReconstructor.ts  # Time-travel engine
│   ├── alphaVantageAPI.ts    # API integration
│   └── calculationEngine.ts  # P/E and growth calculations
├── types.ts             # TypeScript interfaces
├── App.tsx              # Main application
├── App.css              # Styling
└── main.tsx             # Entry point
```

## 🔧 Customization

### Adding More Years

Edit `SNAPSHOT_DATES` in `src/utils/portfolioReconstructor.ts`:

```typescript
const SNAPSHOT_DATES = [
  '2018-12-31',  // Add earlier years
  '2019-12-31',
  '2020-12-31',
  // ... etc
];
```

### Supporting Other Brokers

Modify `src/utils/csvParser.ts` to parse CSV formats from other brokers (E*TRADE, Schwab, etc.)

### Using Different APIs

Replace the Alpha Vantage integration in `src/utils/alphaVantageAPI.ts` with other providers like Finnhub, IEX Cloud, or Yahoo Finance.

## 🐛 Troubleshooting

### "No valid transactions found"

- Check that your CSV has the required columns
- Verify the date format is recognized (MM/DD/YYYY or YYYY-MM-DD)

### "Failed to fetch any stock data"

- Verify your API key is correct
- Check you haven't exceeded daily API limits (500 calls/day for free tier)
- Some tickers may not be available in Alpha Vantage

### Charts not displaying

- Ensure there's valid data for at least one year
- Check browser console for errors
- Try refreshing the page

## 📝 License

MIT License - feel free to use this for your own portfolio analysis!

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## ⚡ Performance Tips

1. **Smaller portfolios first**: Test with a CSV containing just a few stocks
2. **Keep the tab open**: Don't close or navigate away during data fetching
3. **Use incognito mode**: If you're testing repeatedly to avoid localStorage issues

## 🎯 Future Enhancements

Potential features for future versions:

- [ ] Support for dividend data
- [ ] Sector breakdown analysis
- [ ] Comparison to market indices (S&P 500)
- [ ] Export results to PDF/CSV
- [ ] Caching of API data to reduce repeated calls
- [ ] Support for multiple portfolios
- [ ] Real-time data updates

## 📧 Questions?

If you encounter issues or have questions about the calculations, check the console logs for detailed debugging information.

---

**Disclaimer**: This tool is for educational and analytical purposes only. It is not financial advice. Always verify calculations independently before making investment decisions.
