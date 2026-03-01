import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { CalculationResult } from '../types';
import { formatCurrency, formatPercent, formatPE } from '../utils/calculationEngine';
import { parseDailyPriceCSV, calculateDailyMetrics, type DailyMetric } from '../utils/dailyMetrics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResultsViewProps {
  results: CalculationResult;
  onReset: () => void;
  portfolioSnapshots: any[]; // Array of PortfolioSnapshot
  stockDataMap: Map<string, any>; // Map of StockData
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onReset, portfolioSnapshots, stockDataMap }) => {
  const { years, portfolioPE, epsGrowth, yearMetrics } = results;
  const [dailyMetrics2023, setDailyMetrics2023] = useState<DailyMetric[]>([]);
  const [dailyMetrics2024, setDailyMetrics2024] = useState<DailyMetric[]>([]);
  const [dailyMetrics2025, setDailyMetrics2025] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);

  // Load and process daily price data
  useEffect(() => {
    const loadDailyData = async () => {
      try {
        console.log('[DailyMetrics] Loading daily price data...');
        const response = await fetch('/pricedata.csv');
        const csvText = await response.text();
        
        console.log('[DailyMetrics] Parsing CSV...');
        const dailyPrices = parseDailyPriceCSV(csvText);
        console.log('[DailyMetrics] Daily prices loaded:', Object.keys(dailyPrices));
        
        // Calculate daily metrics for 2023 (using 2023 year-end holdings)
        const snapshot2023 = portfolioSnapshots.find(s => s.date === '2023-12-31');
        if (snapshot2023) {
          console.log('[DailyMetrics] Calculating 2023 daily metrics using 2023 year-end holdings...');
          const metrics2023 = calculateDailyMetrics(
            snapshot2023,
            snapshot2023,
            stockDataMap,
            dailyPrices,
            2023
          );
          setDailyMetrics2023(metrics2023);
          console.log('[DailyMetrics] 2023 metrics calculated:', metrics2023.length, 'days');
        }
        
        // Calculate daily metrics for 2024 (using 2024 year-end holdings)
        const snapshot2024 = portfolioSnapshots.find(s => s.date === '2024-12-31');
        if (snapshot2024) {
          console.log('[DailyMetrics] Calculating 2024 daily metrics using 2024 year-end holdings...');
          const metrics2024 = calculateDailyMetrics(
            snapshot2024,
            snapshot2024,
            stockDataMap,
            dailyPrices,
            2024
          );
          setDailyMetrics2024(metrics2024);
          console.log('[DailyMetrics] 2024 metrics calculated:', metrics2024.length, 'days');
        }
        
        // Calculate daily metrics for 2025 (using 2025 year-end holdings)
        const snapshot2025 = portfolioSnapshots.find(s => s.date === '2025-12-31');
        if (snapshot2025) {
          console.log('[DailyMetrics] Calculating 2025 daily metrics using 2025 year-end holdings...');
          const metrics2025 = calculateDailyMetrics(
            snapshot2025,
            snapshot2025,
            stockDataMap,
            dailyPrices,
            2025
          );
          setDailyMetrics2025(metrics2025);
          console.log('[DailyMetrics] 2025 metrics calculated:', metrics2025.length, 'days');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('[DailyMetrics] Error loading daily data:', error);
        setLoading(false);
      }
    };
    
    loadDailyData();
  }, [portfolioSnapshots, stockDataMap]);

  // P/E Ratio Chart Configuration
  const peChartData = {
    labels: years.map(y => y.toString()),
    datasets: [
      {
        label: 'Portfolio P/E Ratio',
        data: portfolioPE,
        borderColor: 'rgb(0, 212, 255)',
        backgroundColor: 'rgba(0, 212, 255, 0.2)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(0, 212, 255)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(0, 212, 255)',
        pointHoverBorderColor: '#fff',
        tension: 0.4
      }
    ]
  };

  const peChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Portfolio P/E Ratio (2020-2025)',
        color: '#00d4ff',
        font: {
          size: 20,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        titleColor: '#00d4ff',
        bodyColor: '#ffffff',
        borderColor: '#00d4ff',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return value !== null ? `P/E: ${formatPE(value)}` : 'N/A';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 212, 255, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#b0b0b0',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 212, 255, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#b0b0b0',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        title: {
          display: true,
          text: 'P/E Ratio',
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  };

  // EPS Growth Chart Configuration
  const growthChartData = {
    labels: years.map(y => y.toString()),
    datasets: [
      {
        label: 'EPS Growth (YoY)',
        data: epsGrowth.map(g => g === null ? 0 : g),
        backgroundColor: epsGrowth.map(g => 
          g === null ? 'rgba(102, 102, 102, 0.6)' :
          g >= 0 ? 'rgba(0, 212, 255, 0.6)' : 'rgba(255, 69, 58, 0.6)'
        ),
        borderColor: epsGrowth.map(g => 
          g === null ? 'rgb(102, 102, 102)' :
          g >= 0 ? 'rgb(0, 212, 255)' : 'rgb(255, 69, 58)'
        ),
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: epsGrowth.map(g => 
          g === null ? 'rgba(102, 102, 102, 0.8)' :
          g >= 0 ? 'rgba(0, 212, 255, 0.8)' : 'rgba(255, 69, 58, 0.8)'
        )
      }
    ]
  };

  const growthChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Portfolio EPS Growth (Year-over-Year)',
        color: '#00d4ff',
        font: {
          size: 20,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        titleColor: '#00d4ff',
        bodyColor: '#ffffff',
        borderColor: '#00d4ff',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = epsGrowth[context.dataIndex];
            return value === null ? 'N/A (First Year)' : formatPercent(value);
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 212, 255, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#b0b0b0',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 212, 255, 0.1)',
          lineWidth: 1
        },
        ticks: {
          color: '#b0b0b0',
          font: {
            size: 12,
            weight: 'bold'
          },
          callback: (value) => `${value}%`
        },
        title: {
          display: true,
          text: 'Growth %',
          color: '#ffffff',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    }
  };

  // Daily P/E Chart Configuration (2023-2025)
  const dailyPEChartData = {
    labels: [
      ...dailyMetrics2023.map(m => m.date.substring(5)), // Show MM-DD only
      ...dailyMetrics2024.map(m => m.date.substring(5)),
      ...dailyMetrics2025.map(m => m.date.substring(5))
    ],
    datasets: [
      {
        label: 'Daily Portfolio P/E Ratio',
        data: [
          ...dailyMetrics2023.map(m => m.portfolioPE),
          ...dailyMetrics2024.map(m => m.portfolioPE),
          ...dailyMetrics2025.map(m => m.portfolioPE)
        ],
        borderColor: 'rgb(138, 43, 226)',
        backgroundColor: 'rgba(138, 43, 226, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4
      }
    ]
  };

  const dailyPEChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: { size: 14, weight: 'bold' },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Daily Portfolio P/E Ratio (Jan 2023 - Nov 2025)',
        color: '#9370db',
        font: { size: 20, weight: 'bold' },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        titleColor: '#9370db',
        bodyColor: '#ffffff',
        borderColor: '#9370db',
        borderWidth: 2,
        padding: 12,
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            if (index < dailyMetrics2023.length) {
              return dailyMetrics2023[index].date;
            } else if (index < dailyMetrics2023.length + dailyMetrics2024.length) {
              return dailyMetrics2024[index - dailyMetrics2023.length].date;
            } else {
              return dailyMetrics2025[index - dailyMetrics2023.length - dailyMetrics2024.length].date;
            }
          },
          label: (context) => {
            const value = context.parsed.y;
            return value !== null ? `P/E: ${formatPE(value)}` : 'N/A';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { color: '#ffffff', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'P/E Ratio',
          color: '#ffffff',
          font: { size: 14, weight: 'bold' }
        }
      },
      x: {
        ticks: {
          color: '#ffffff',
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'Date (MM-DD)',
          color: '#ffffff',
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  };

  // Daily Weighted EPS Chart Configuration (2023-2025)
  const dailyEPSChartData = {
    labels: [
      ...dailyMetrics2023.map(m => m.date.substring(5)),
      ...dailyMetrics2024.map(m => m.date.substring(5)),
      ...dailyMetrics2025.map(m => m.date.substring(5))
    ],
    datasets: [
      {
        label: 'Daily Weighted Portfolio EPS',
        data: [
          ...dailyMetrics2023.map(m => m.weightedEPS),
          ...dailyMetrics2024.map(m => m.weightedEPS),
          ...dailyMetrics2025.map(m => m.weightedEPS)
        ],
        borderColor: 'rgb(255, 140, 0)',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.4
      }
    ]
  };

  // Performance Attribution Chart Configuration
  const attributionData = (() => {
    const years: string[] = [];
    const epsContributions: number[] = [];
    const peContributions: number[] = [];
    const totalReturns: number[] = [];

    for (let i = 1; i < yearMetrics.length; i++) {
      const prevYear = yearMetrics[i - 1];
      const currYear = yearMetrics[i];
      
      // Use portfolio earnings per share (total earnings / total shares)
      // This represents the actual weighted average EPS of the portfolio
      const prevTotalShares = prevYear.stockBreakdowns?.reduce((sum: number, stock: any) => sum + stock.quantity, 0) || 0;
      const currTotalShares = currYear.stockBreakdowns?.reduce((sum: number, stock: any) => sum + stock.quantity, 0) || 0;
      
      const prevPortfolioEPS = prevTotalShares > 0 ? prevYear.portfolioEarnings / prevTotalShares : 0;
      const currPortfolioEPS = currTotalShares > 0 ? currYear.portfolioEarnings / currTotalShares : 0;
      
      const prevPE = prevYear.portfolioPE;
      const currPE = currYear.portfolioPE;
      
      if (prevPortfolioEPS > 0 && prevPE > 0 && currPortfolioEPS > 0 && currPE > 0) {
        // EPS Growth: how much did earnings per share grow?
        const epsGrowthPct = ((currPortfolioEPS / prevPortfolioEPS) - 1) * 100;
        
        // Valuation Change: how much did the P/E multiple change?
        const peChangePct = ((currPE / prevPE) - 1) * 100;
        
        // Total return approximation: (1 + EPS growth) * (1 + P/E change) - 1
        const totalReturn = ((1 + epsGrowthPct / 100) * (1 + peChangePct / 100) - 1) * 100;
        
        years.push(`${prevYear.year}-${currYear.year}`);
        epsContributions.push(epsGrowthPct);
        peContributions.push(peChangePct);
        totalReturns.push(totalReturn);
        
        console.log(`[Attribution] ${prevYear.year}-${currYear.year}:`, {
          prevPortfolioEPS: prevPortfolioEPS.toFixed(2),
          currPortfolioEPS: currPortfolioEPS.toFixed(2),
          epsGrowthPct: epsGrowthPct.toFixed(2) + '%',
          prevPE: prevPE.toFixed(2),
          currPE: currPE.toFixed(2),
          peChangePct: peChangePct.toFixed(2) + '%',
          totalReturn: totalReturn.toFixed(2) + '%'
        });
      }
    }
    
    return { years, epsContributions, peContributions, totalReturns };
  })();

  const attributionChartData = {
    labels: attributionData.years,
    datasets: [
      {
        label: 'EPS Growth Contribution',
        data: attributionData.epsContributions,
        backgroundColor: 'rgba(0, 212, 255, 0.8)',
        borderColor: 'rgb(0, 212, 255)',
        borderWidth: 2
      },
      {
        label: 'Valuation (P/E) Contribution',
        data: attributionData.peContributions,
        backgroundColor: 'rgba(255, 140, 0, 0.8)',
        borderColor: 'rgb(255, 140, 0)',
        borderWidth: 2
      }
    ]
  };

  const attributionChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: { size: 14, weight: 'bold' },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Portfolio Return Attribution: EPS Growth vs Valuation Change',
        color: '#00d4ff',
        font: { size: 20, weight: 'bold' },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        titleColor: '#00d4ff',
        bodyColor: '#ffffff',
        borderColor: '#00d4ff',
        borderWidth: 2,
        padding: 12,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return `${label}: N/A`;
            return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
          },
          afterBody: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            const total = attributionData.totalReturns[index];
            return `\nApprox Total Return: ${total >= 0 ? '+' : ''}${total.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        ticks: { color: '#ffffff', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      y: {
        stacked: false,
        ticks: { 
          color: '#ffffff', 
          font: { size: 12 },
          callback: (value) => `${value}%`
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'Contribution to Return (%)',
          color: '#ffffff',
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  };

  const dailyEPSChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: { size: 14, weight: 'bold' },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Daily Weighted Portfolio EPS (Jan 2023 - Nov 2025)',
        color: '#ff8c00',
        font: { size: 20, weight: 'bold' },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        titleColor: '#ff8c00',
        bodyColor: '#ffffff',
        borderColor: '#ff8c00',
        borderWidth: 2,
        padding: 12,
        callbacks: {
          title: (tooltipItems) => {
            const index = tooltipItems[0].dataIndex;
            if (index < dailyMetrics2023.length) {
              return dailyMetrics2023[index].date;
            } else if (index < dailyMetrics2023.length + dailyMetrics2024.length) {
              return dailyMetrics2024[index - dailyMetrics2023.length].date;
            } else {
              return dailyMetrics2025[index - dailyMetrics2023.length - dailyMetrics2024.length].date;
            }
          },
          label: (context) => {
            const value = context.parsed.y;
            return value !== null ? `Weighted EPS: $${value.toFixed(2)}` : 'N/A';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { color: '#ffffff', font: { size: 12 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'Weighted EPS ($)',
          color: '#ffffff',
          font: { size: 14, weight: 'bold' }
        }
      },
      x: {
        ticks: {
          color: '#ffffff',
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        title: {
          display: true,
          text: 'Date (MM-DD)',
          color: '#ffffff',
          font: { size: 14, weight: 'bold' }
        }
      }
    }
  };

  return (
    <div className="results-view">
      <div className="results-header">
        <h2>Portfolio Analysis Results</h2>
        <button onClick={onReset} className="reset-button">
          🔄 Analyze Another Portfolio
        </button>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <Line data={peChartData} options={peChartOptions} />
        </div>
        
        <div className="chart-wrapper">
          <Bar data={growthChartData} options={growthChartOptions} />
        </div>
      </div>

      {/* Performance Attribution Chart */}
      {attributionData.years.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="chart-wrapper">
            <Bar data={attributionChartData} options={attributionChartOptions} />
          </div>
          <p style={{ textAlign: 'center', color: '#999', marginTop: '1rem', fontSize: '0.9rem' }}>
            This chart shows how much of your portfolio's year-over-year performance came from <strong style={{ color: '#00d4ff' }}>EPS growth</strong> (fundamental earnings improvement) 
            versus <strong style={{ color: '#ff8c00' }}>valuation changes</strong> (P/E multiple expansion/contraction). 
            The two effects multiply together to give approximate total return.
          </p>
        </div>
      )}

      {/* Daily Temporal Charts */}
      {!loading && (dailyMetrics2023.length > 0 || dailyMetrics2024.length > 0 || dailyMetrics2025.length > 0) && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ color: '#00d4ff', marginBottom: '1.5rem', textAlign: 'center' }}>
            📈 Daily Portfolio Metrics Evolution (Jan 2023 - Nov 2025)
          </h3>
          <div className="charts-container">
            <div className="chart-wrapper">
              <Line data={dailyPEChartData} options={dailyPEChartOptions} />
            </div>
            
            <div className="chart-wrapper">
              <Line data={dailyEPSChartData} options={dailyEPSChartOptions} />
            </div>
          </div>
          <p style={{ textAlign: 'center', color: '#999', marginTop: '1rem', fontSize: '0.9rem' }}>
            These charts show how your portfolio's P/E ratio and weighted EPS evolved daily from January 2023 through November 2025 based on price movements,
            using year-end holdings for each respective year (2023 holdings for all of 2023, 2024 holdings for all of 2024, 2025 holdings for all of 2025).
            EPS values smoothly interpolate throughout each year from previous year to current year values.
          </p>
        </div>
      )}
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#00d4ff' }}>
          <p>⏳ Loading daily price data...</p>
        </div>
      )}

      <div className="metrics-table">
        <h3>📊 Portfolio Summary by Year</h3>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Portfolio Value</th>
              <th>Portfolio Earnings</th>
              <th>P/E Ratio</th>
              <th>EPS Growth</th>
            </tr>
          </thead>
          <tbody>
            {yearMetrics.map((metric) => (
              <tr key={metric.year}>
                <td><strong>{metric.year}</strong></td>
                <td>{formatCurrency(metric.portfolioValue)}</td>
                <td>{formatCurrency(metric.portfolioEarnings)}</td>
                <td><strong>{formatPE(metric.portfolioPE)}</strong></td>
                <td style={{ 
                  color: metric.epsGrowth === null ? '#999' : 
                         metric.epsGrowth >= 0 ? '#00d4ff' : '#ff453a',
                  fontWeight: 'bold'
                }}>
                  {metric.epsGrowth === null ? 'N/A' : formatPercent(metric.epsGrowth)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Breakdown Tables for Each Year */}
      {yearMetrics.map((metric) => metric.stockBreakdowns && metric.stockBreakdowns.length > 0 && (
        <div key={`breakdown-${metric.year}`} className="stock-breakdown-section">
          <h3>📈 {metric.year} Portfolio Composition</h3>
          <table className="stock-breakdown-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Market Value</th>
                <th>Weight</th>
                <th>EPS</th>
                <th>Total Earnings</th>
                <th>Stock P/E</th>
                <th>EPS Growth YoY</th>
              </tr>
            </thead>
            <tbody>
              {metric.stockBreakdowns.map((stock) => (
                <tr key={stock.symbol}>
                  <td><strong>{stock.symbol}</strong></td>
                  <td>{stock.quantity.toFixed(2)}</td>
                  <td>{formatCurrency(stock.price)}</td>
                  <td>{formatCurrency(stock.marketValue)}</td>
                  <td style={{ 
                    fontWeight: 'bold', 
                    color: '#00d4ff',
                    fontSize: '1.1em'
                  }}>
                    {stock.weight.toFixed(1)}%
                  </td>
                  <td>{formatCurrency(stock.eps)}</td>
                  <td>{formatCurrency(stock.stockEarnings)}</td>
                  <td>{formatPE(stock.stockPE)}</td>
                  <td style={{
                    color: stock.epsGrowth === null ? '#999' :
                           stock.epsGrowth >= 0 ? '#00d4ff' : '#ff453a',
                    fontWeight: 'bold'
                  }}>
                    {stock.epsGrowth === null ? 'N/A' : formatPercent(stock.epsGrowth)}
                  </td>
                </tr>
              ))}
              <tr style={{ 
                borderTop: '2px solid #00d4ff', 
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 212, 255, 0.1)'
              }}>
                <td colSpan={3}>Portfolio Total</td>
                <td>{formatCurrency(metric.portfolioValue)}</td>
                <td>100%</td>
                <td style={{ color: '#00d4ff' }}>
                  {(() => {
                    // Calculate weighted average EPS
                    let totalWeightedEPS = 0;
                    metric.stockBreakdowns.forEach(stock => {
                      totalWeightedEPS += stock.eps * (stock.weight / 100);
                    });
                    return formatCurrency(totalWeightedEPS);
                  })()}
                </td>
                <td>{formatCurrency(metric.portfolioEarnings)}</td>
                <td style={{ color: '#00d4ff' }}>{formatPE(metric.portfolioPE)}</td>
                <td style={{ color: '#00d4ff' }}>
                  {(() => {
                    // Calculate weighted average EPS growth
                    let totalWeightedGrowth = 0;
                    let totalWeight = 0;
                    metric.stockBreakdowns.forEach(stock => {
                      if (stock.epsGrowth !== null) {
                        totalWeightedGrowth += stock.epsGrowth * stock.weight;
                        totalWeight += stock.weight;
                      }
                    });
                    const weightedAvg = totalWeight > 0 ? totalWeightedGrowth / totalWeight : null;
                    return weightedAvg === null ? 'N/A' : formatPercent(weightedAvg);
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

