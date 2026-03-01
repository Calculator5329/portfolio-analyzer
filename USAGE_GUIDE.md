# 📖 Usage Guide - Portfolio P/E & EPS Growth Analyzer

## Quick Start

### 1. Start the Application

```bash
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

### 2. Prepare Your Data

#### Option A: Use the Sample File (for testing)

We've included `sample-fidelity-transactions.csv` in the project root that you can use to test the application.

#### Option B: Export from Fidelity

1. Log into Fidelity.com
2. Go to **Accounts & Trade** → **Portfolio**
3. Click **Download** or **Export**
4. Select **Transaction History**
5. Choose **CSV format**
6. Download the file

### 3. Get Alpha Vantage API Key

1. Visit [https://www.alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
2. Enter your email and click **GET FREE API KEY**
3. Copy the API key (looks like: `ABC123XYZ456`)

### 4. Run the Analysis

1. Click **"📁 Upload Fidelity CSV"**
2. Select your CSV file
3. Enter your Alpha Vantage API key
4. Click **"Start Analysis"**
5. Wait patiently (this can take several minutes)
6. View your results!

## Understanding Your Results

### Portfolio P/E Ratio Chart

This line chart shows your portfolio's valuation over time:

- **Lower P/E** = More value-oriented portfolio
- **Higher P/E** = More growth-oriented portfolio
- **Trend** = Whether you've become more value or growth focused

**Example Interpretation:**
- P/E of 15-20 = Value-focused
- P/E of 20-30 = Balanced
- P/E of 30+ = Growth-focused

### EPS Growth Chart

This bar chart shows how your portfolio's earnings grew year-over-year:

- **Green bars** = Positive growth (earnings increased)
- **Red bars** = Negative growth (earnings decreased)
- **Gray bar** = First year (no comparison)

**Example Interpretation:**
- +20% growth = Strong earnings expansion
- 0-10% growth = Modest growth
- Negative growth = Earnings declined (recession, company struggles)

### Metrics Table

Detailed breakdown for each year:

- **Portfolio Value**: Total market value of all your holdings on 12/31
- **Portfolio Earnings**: Total annual EPS × shares for all holdings
- **P/E Ratio**: Value ÷ Earnings (portfolio-weighted)
- **EPS Growth**: % change from previous year

## CSV Format Requirements

Your CSV must include these columns (names may vary slightly):

| Column Name | Alternative Names | Description |
|-------------|-------------------|-------------|
| Run Date | Trade Date, Date | Transaction date |
| Action | Transaction | BUY, SELL, PURCHASE, SALE |
| Symbol | Stock Symbol, Ticker | Stock ticker (e.g., AAPL) |
| Quantity | Shares, Qty | Number of shares |
| Price | Amount, Price ($) | Price per share |

### Sample CSV Format

```csv
Run Date,Action,Symbol,Quantity,Price
2020-01-15,BUY,AAPL,10,75.00
2020-03-20,BUY,MSFT,15,150.00
2020-06-10,SELL,AAPL,2,115.00
```

## Common Issues & Solutions

### ❌ "No valid transactions found in CSV file"

**Causes:**
- CSV is empty or corrupted
- Missing required columns
- Date format not recognized

**Solutions:**
- Open CSV in Excel/Notepad to verify format
- Ensure column headers match expected names
- Check that dates are in MM/DD/YYYY or YYYY-MM-DD format

### ❌ "Failed to fetch any stock data"

**Causes:**
- Invalid API key
- Exceeded API rate limits (500 calls/day)
- Network connectivity issues
- Ticker not found in Alpha Vantage

**Solutions:**
- Double-check your API key
- Wait 24 hours if you hit daily limit
- Check internet connection
- Verify ticker symbols are correct (some tickers may not be available)

### ❌ Charts show zero or missing data

**Causes:**
- Stock data not available for that time period
- Ticker delisted or changed
- API returned incomplete data

**Solutions:**
- Check console logs (F12 → Console) for specific errors
- Some stocks may not have full 2020-2025 data
- Try with major stocks (AAPL, MSFT, GOOGL) first

### ⚠️ Processing takes a very long time

**This is normal!** Alpha Vantage free tier limits:
- **5 API calls per minute**
- **2 calls per stock** (earnings + prices)
- **12 seconds between calls**

**Expected times:**
- 5 stocks ≈ 2 minutes
- 10 stocks ≈ 4 minutes
- 20 stocks ≈ 8 minutes
- 30 stocks ≈ 12 minutes

**Tips:**
- Keep the browser tab open
- Don't refresh the page
- Start with a smaller portfolio to test
- Consider upgrading to Alpha Vantage paid plan for faster processing

## Advanced Tips

### Testing with Sample Data

Use the included `sample-fidelity-transactions.csv` for quick testing:

```bash
# File is already in project root
# Just upload it through the UI
```

### Filtering Your CSV

To speed up testing, filter your Fidelity export to include only:
- Major holdings (top 10 stocks by value)
- Specific time period (2020-2024 only)
- Remove penny stocks or minor positions

### Understanding the Math

The app calculates portfolio-weighted metrics, NOT simple averages:

**Wrong way (simple average):**
```
Average P/E = (Stock1 P/E + Stock2 P/E) / 2
```

**Correct way (portfolio-weighted):**
```
Portfolio P/E = (Stock1 Value + Stock2 Value) / (Stock1 Earnings + Stock2 Earnings)
```

This gives accurate representation based on your position sizes.

### Data Privacy

All processing happens **100% in your browser**:
- ✅ CSV never leaves your computer
- ✅ API calls go directly to Alpha Vantage
- ✅ No data stored on any server
- ✅ No tracking or analytics

Your financial data is completely private.

## Troubleshooting Checklist

Before asking for help, try these steps:

1. ✅ Verify CSV has correct columns and format
2. ✅ Test API key at Alpha Vantage website
3. ✅ Check browser console (F12) for error messages
4. ✅ Try with sample CSV first
5. ✅ Ensure you haven't exceeded API daily limit
6. ✅ Test with just 2-3 major stocks (AAPL, MSFT, GOOGL)
7. ✅ Clear browser cache and reload

## API Rate Limit Management

If you hit rate limits:

### Free Tier Limits
- 5 API calls per minute
- 500 API calls per day

### Workarounds
1. **Reduce stocks**: Filter to top holdings only
2. **Wait**: Daily limit resets at midnight EST
3. **Upgrade**: Consider Alpha Vantage premium ($50/month)
4. **Alternative APIs**: Modify code to use IEX Cloud, Finnhub, etc.

## Browser Requirements

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

Requires JavaScript enabled.

## Need Help?

### Debug Mode

Open browser console (F12) to see detailed logs:
- CSV parsing results
- API call progress
- Calculation steps
- Error details

### Export Results

To save your results:
1. Take a screenshot of the charts
2. Copy table data to Excel
3. Use browser's "Save as PDF" feature

(Future version may include export feature)

## Example Interpretation

Let's say your results show:

```
Year    P/E    EPS Growth
2020    25.0   N/A
2021    28.5   +15.2%
2022    22.0   -12.8%
2023    30.2   +28.5%
2024    26.8   +8.2%
```

**Story this tells:**

1. **2020**: Started with a balanced portfolio (P/E 25)
2. **2021**: Rotated to growth stocks (P/E rose to 28.5), earnings grew 15%
3. **2022**: Earnings declined (recession?), you may have sold some positions
4. **2023**: Strong earnings recovery (+28.5%), back to growth focus
5. **2024**: Portfolio stabilizing, moderate growth continuing

This "time travel" view helps you understand:
- How your investment strategy evolved
- Whether timing worked in your favor
- How your portfolio's fundamentals changed over time

---

**Happy analyzing! 📊**

