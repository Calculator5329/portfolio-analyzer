# 🏗️ Technical Architecture

## System Overview

The Portfolio P/E & EPS Growth Analyzer is a single-page React application that processes financial transaction data entirely in the browser. No backend server is required.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                       User Interface                     │
│                         (App.tsx)                        │
└───────────────┬─────────────────────────────────────────┘
                │
    ┌───────────┼───────────┬───────────┬─────────────┐
    │           │           │           │             │
    ▼           ▼           ▼           ▼             ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   ┌──────────┐
│ File   │ │  API   │ │Progress│ │Results │   │   Types  │
│Uploader│ │  Key   │ │Indicator│ │  View  │   │ (types.ts)│
└────────┘ └────────┘ └────────┘ └────────┘   └──────────┘
                │                      │
                │                      │
    ┌───────────┼──────────────────────┼──────────┐
    │           │                      │          │
    ▼           ▼                      ▼          ▼
┌────────┐ ┌────────────┐      ┌────────────┐ ┌────────┐
│  CSV   │ │ Portfolio  │      │Calculation │ │ Chart  │
│ Parser │ │Reconstructor│      │  Engine    │ │ .js    │
└────────┘ └────────────┘      └────────────┘ └────────┘
                │                      │
                │                      │
                ▼                      │
          ┌──────────┐                │
          │ Alpha    │                │
          │ Vantage  │◄───────────────┘
          │   API    │
          └──────────┘
```

## Data Flow

### Step-by-Step Process

1. **Upload & Parse** (`FileUploader` → `csvParser`)
   - User uploads CSV file
   - PapaParse reads file in-browser
   - Validates and structures transaction data

2. **Portfolio Reconstruction** (`portfolioReconstructor`)
   - Replays all transactions chronologically
   - Creates snapshots at each year-end (2020-2025)
   - Calculates exact holdings at each snapshot date

3. **Data Fetching** (`alphaVantageAPI`)
   - Extracts unique tickers from snapshots
   - Fetches annual EPS data for each ticker
   - Fetches historical prices for year-end dates
   - Implements rate limiting (12s between calls)

4. **Calculation** (`calculationEngine`)
   - For each year snapshot:
     - Calculates total portfolio value (Σ shares × price)
     - Calculates total portfolio earnings (Σ shares × EPS)
     - Computes portfolio-weighted P/E ratio
     - Calculates YoY EPS growth

5. **Visualization** (`ResultsView` + Chart.js)
   - Renders P/E trend as line chart
   - Renders EPS growth as bar chart
   - Displays detailed metrics table

## Module Breakdown

### Core Modules (`src/utils/`)

#### 1. `csvParser.ts`

**Purpose:** Parse Fidelity CSV files into structured transaction objects

**Key Functions:**
- `parseFidelityCSV(file: File)`: Main parser function
- `extractTickers(transactions)`: Get unique ticker list

**Flexibility:** Handles multiple column name variations (e.g., "Run Date" vs "Trade Date")

**Dependencies:**
- PapaParse for CSV parsing

#### 2. `portfolioReconstructor.ts`

**Purpose:** The "time-travel" engine that reconstructs portfolio holdings

**Key Functions:**
- `reconstructPortfolio(transactions)`: Main reconstruction function
- `calculateHoldingsAtDate(transactions, date)`: Calculate holdings at specific date
- `getSnapshotTickers(snapshots)`: Extract tickers from all snapshots

**Algorithm:**
```typescript
for each snapshot_date in [2020-12-31, 2021-12-31, ...]:
    holdings = {}
    for each transaction where transaction.date <= snapshot_date:
        if transaction.action == "BUY":
            holdings[symbol] += quantity
        else if transaction.action == "SELL":
            holdings[symbol] -= quantity
    snapshots.push({ date: snapshot_date, holdings: holdings })
```

**Snapshot Dates:** Defined in `SNAPSHOT_DATES` constant (easily modifiable)

#### 3. `alphaVantageAPI.ts`

**Purpose:** Fetch historical financial data from Alpha Vantage

**Key Functions:**
- `fetchEarnings(symbol, apiKey)`: Get annual EPS data
- `fetchHistoricalPrices(symbol, apiKey)`: Get daily price history
- `fetchStockData(symbol, apiKey)`: Combined fetcher
- `fetchAllStockData(symbols, apiKey, onProgress)`: Batch fetcher with rate limiting
- `findClosestPrice(prices, targetDate)`: Handle weekends/holidays

**Rate Limiting:**
```typescript
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
await delay(12000) // 12s = 5 calls per minute
```

**Error Handling:**
- Continues processing even if one stock fails
- Logs errors but doesn't stop entire process
- Returns partial results

#### 4. `calculationEngine.ts`

**Purpose:** Compute portfolio-weighted financial metrics

**Key Functions:**
- `calculatePortfolioMetrics(snapshots, stockDataMap)`: Main calculator
- `calculateYearMetrics(snapshot, stockDataMap, year)`: Single year calculation
- `formatCurrency()`, `formatPercent()`, `formatPE()`: Display formatting

**Portfolio-Weighted P/E Formula:**
```
P/E = Σ(shares_i × price_i) / Σ(shares_i × EPS_i)
```

**EPS Growth Formula:**
```
Growth = (Earnings_current - Earnings_previous) / Earnings_previous × 100
```

### Components (`src/components/`)

#### 1. `FileUploader.tsx`

Simple file input component:
- Hidden `<input type="file">` 
- Styled button trigger
- Accepts only `.csv` files
- Emits `onFileSelected(file)` callback

#### 2. `APIKeyInput.tsx`

API key input form:
- Text input for API key
- Link to Alpha Vantage registration
- Form validation
- Emits `onAPIKeySubmit(key)` callback

#### 3. `ProgressIndicator.tsx`

Loading progress display:
- Animated progress bar
- Current/total counter
- Status message
- Percentage calculation

#### 4. `ResultsView.tsx`

Main results display:
- Two Chart.js charts (line + bar)
- Detailed metrics table
- Reset button
- Responsive layout

**Chart Configuration:**
- Uses `react-chartjs-2` wrapper
- Registers necessary Chart.js components
- Custom tooltips with formatted values
- Color-coded bars (green = positive, red = negative)

### Main App (`src/App.tsx`)

Central orchestrator that manages:

**State Management:**
```typescript
type AppStep = 'upload' | 'api-key' | 'processing' | 'results'

const [step, setStep] = useState<AppStep>('upload')
const [transactions, setTransactions] = useState<Transaction[]>([])
const [results, setResults] = useState<CalculationResult | null>(null)
const [progress, setProgress] = useState(0)
const [error, setError] = useState<string | null>(null)
```

**Step Flow:**
1. `upload` → User uploads CSV
2. `api-key` → User enters API key
3. `processing` → Data fetching & calculation
4. `results` → Display charts & metrics

### Types (`src/types.ts`)

TypeScript interfaces for type safety:

**Transaction Data:**
- `FidelityTransaction`: Parsed CSV row
- `PortfolioSnapshot`: Holdings at a point in time

**API Data:**
- `AnnualEarnings`: Fiscal year EPS data
- `StockData`: Combined earnings + prices

**Results:**
- `YearMetrics`: Calculated metrics for one year
- `CalculationResult`: Complete analysis results

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| PapaParse | 5.x | CSV parsing |
| Chart.js | 4.x | Data visualization |
| react-chartjs-2 | 5.x | React wrapper for Chart.js |

### Why These Choices?

**React + TypeScript:**
- Component reusability
- Type safety prevents bugs
- Large ecosystem

**Vite:**
- Fast development experience
- Optimized production builds
- Modern ESM support

**PapaParse:**
- Reliable CSV parsing
- Handles edge cases
- Works in browser

**Chart.js:**
- Feature-rich
- Good documentation
- Customizable

## Performance Considerations

### Bottlenecks

1. **API Rate Limiting** (Primary)
   - Free tier: 5 calls/minute
   - 2 calls per stock
   - 10 stocks = ~4 minutes

2. **CSV Parsing**
   - PapaParse is fast
   - Most CSVs parse in <1 second
   - Not a bottleneck

3. **Calculations**
   - Pure JavaScript math
   - Completes in milliseconds
   - Not a bottleneck

### Optimization Opportunities

1. **Caching:**
   - Store fetched data in localStorage
   - Avoid re-fetching same stocks
   - Could reduce API calls by 90%

2. **Parallel API Calls:**
   - Current: Sequential (12s per stock)
   - Could do: 5 parallel (respects rate limit)
   - Would reduce time by ~5x

3. **Web Workers:**
   - Move calculations to background thread
   - Keep UI responsive
   - Minimal benefit (calculations are fast)

## Error Handling Strategy

### Graceful Degradation

1. **CSV Parse Errors:**
   - Show specific error message
   - Allow retry
   - Don't crash app

2. **API Failures:**
   - Continue with partial data
   - Log individual stock failures
   - Show results for successful fetches

3. **Missing Data:**
   - Skip stocks without complete data
   - Warn in console
   - Don't stop entire process

### User Feedback

- Clear error messages
- Progress indicators
- Console logging for debugging

## Extension Points

### Adding New Data Sources

To support additional brokers (E*TRADE, Schwab, etc.):

1. Modify `csvParser.ts`:
```typescript
export const parseETradeCSV = (file: File) => {
  // Custom parsing logic
}
```

2. Add broker selector in UI

### Using Different APIs

To use IEX Cloud instead of Alpha Vantage:

1. Create `src/utils/iexCloudAPI.ts`
2. Implement same interface:
   - `fetchStockData(symbol, apiKey)`
   - `fetchAllStockData(symbols, apiKey, onProgress)`
3. Swap in `App.tsx`

### Adding More Metrics

To calculate additional metrics (P/B ratio, dividend yield, etc.):

1. Extend `types.ts`:
```typescript
interface YearMetrics {
  // ... existing fields
  priceToBook: number;
  dividendYield: number;
}
```

2. Fetch additional data in API module
3. Add calculations in `calculationEngine.ts`
4. Display in `ResultsView.tsx`

### Supporting More Years

To analyze 2015-2025 instead of 2020-2025:

1. Edit `portfolioReconstructor.ts`:
```typescript
const SNAPSHOT_DATES = [
  '2015-12-31',
  '2016-12-31',
  // ...
  '2025-12-31'
];
```

That's it! Everything else adapts automatically.

## Testing Strategy

### Manual Testing Checklist

- [ ] Upload valid CSV
- [ ] Upload invalid CSV (should show error)
- [ ] Enter valid API key
- [ ] Enter invalid API key (should show error)
- [ ] Process small portfolio (2-3 stocks)
- [ ] Process medium portfolio (10 stocks)
- [ ] Test with sample CSV
- [ ] Verify charts render correctly
- [ ] Check metrics table accuracy
- [ ] Test reset functionality
- [ ] Test responsive design (mobile)

### Future: Automated Testing

Potential test structure:

```typescript
// Unit tests
describe('csvParser', () => {
  it('should parse valid CSV', () => {})
  it('should handle missing columns', () => {})
})

describe('portfolioReconstructor', () => {
  it('should calculate correct holdings', () => {})
  it('should handle stock splits', () => {})
})

describe('calculationEngine', () => {
  it('should calculate correct P/E ratio', () => {})
  it('should calculate correct EPS growth', () => {})
})
```

## Security Considerations

### Data Privacy

- ✅ All processing client-side
- ✅ No data sent to backend
- ✅ API key not stored
- ✅ CSV not uploaded anywhere

### API Key Safety

- ⚠️ API key visible in network requests
- ⚠️ No encryption (not needed for read-only free API)
- ✅ Not stored persistently
- ✅ Only used for API calls

**Recommendation:** Users should use free-tier keys, not paid production keys.

## Deployment

### Static Hosting

Build and deploy to any static host:

```bash
npm run build
# Upload dist/ folder to:
# - Netlify
# - Vercel
# - GitHub Pages
# - AWS S3 + CloudFront
```

### Environment Variables

For production, use `.env`:

```
VITE_DEFAULT_API_KEY=demo_key_for_testing
```

Load in code:
```typescript
const defaultKey = import.meta.env.VITE_DEFAULT_API_KEY
```

## Future Enhancements

### High Priority

1. **Data Caching**
   - localStorage for API responses
   - Reduce redundant API calls
   - Faster re-analysis

2. **Export Results**
   - Download as PDF
   - Export CSV of metrics
   - Save charts as images

3. **Parallel API Calls**
   - Respect rate limit (5/min)
   - Process faster
   - Better UX

### Medium Priority

4. **Additional Metrics**
   - P/B ratio
   - Dividend yield
   - Sector breakdown
   - Market cap distribution

5. **Benchmarking**
   - Compare to S&P 500
   - Compare to sector indices
   - Relative performance

6. **Multi-Portfolio Support**
   - Compare multiple portfolios
   - Track different accounts
   - Family aggregation

### Low Priority

7. **Real-time Updates**
   - Live price feeds
   - Auto-refresh data
   - Notifications

8. **Advanced Visualizations**
   - Heatmaps
   - Correlation matrices
   - Rolling metrics

## Contributing Guidelines

### Code Style

- Use TypeScript strictly
- No `any` types
- Use `type` imports
- Follow existing patterns

### File Organization

```
src/
  components/     # Reusable UI components
  utils/          # Business logic modules
  types.ts        # TypeScript definitions
  App.tsx         # Main application
  App.css         # Styling
```

### Naming Conventions

- Components: PascalCase (`FileUploader.tsx`)
- Utils: camelCase (`csvParser.ts`)
- Types: PascalCase (`FidelityTransaction`)
- Functions: camelCase (`parseFidelityCSV`)

### Pull Request Process

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Update documentation
5. Submit PR with description

---

**Questions? Check the code - it's well-commented! 🚀**

