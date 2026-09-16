import { useRef, useEffect } from 'react'
import Chart from 'chart.js/auto'
import type { ChartDataPoint } from '../../hooks/roiCalculator.types'

interface ROIChartProps {
  chartData: ChartDataPoint[]
  paybackPeriod: number
  netCost: number
  annualSavings: number
}

export default function ROIChart({ chartData, paybackPeriod, netCost, annualSavings }: ROIChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const labels = chartData.map((d) => `Yr ${d.year}`)
    const values = chartData.map((d) => d.cumulativeCashflow)
    const baseline = Array(25).fill(0)

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Cumulative Cashflow (₹)',
            data: values,
            borderColor: '#ff8a1d',
            backgroundColor: 'rgba(255, 138, 29, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
          {
            label: 'Break-even Baseline (₹0)',
            data: baseline,
            borderColor: 'rgba(255, 255, 255, 0.25)',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#9fb3c8',
              font: { family: 'Outfit', size: 10 },
            },
          },
          tooltip: {
            backgroundColor: '#0d2134',
            titleColor: '#f7fbff',
            bodyColor: '#9fb3c8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#9fb3c8', font: { family: 'Outfit', size: 9 } },
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#9fb3c8',
              font: { family: 'Outfit', size: 9 },
              callback(this, tickValue) {
                const num = typeof tickValue === 'number' ? tickValue : parseFloat(tickValue)
                if (!isNaN(num) && Math.abs(num) >= 100000) {
                  return `${(num / 100000).toFixed(1)}L`
                }
                return tickValue
              },
            },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [chartData, paybackPeriod, netCost, annualSavings])

  if (chartData.length === 0) return null

  return (
    <div className="card-base chart-fullwidth-card" style={{ marginTop: '20px', '--card-theme': '255, 138, 29' } as React.CSSProperties}>
      <div className="kpi-header-row">
        <span className="kpi-title">Savings Growth Over 25 Years</span>
      </div>
      <div style={{ height: '250px', position: 'relative' }}>
        <canvas ref={canvasRef} id="tabRoiTrendChart"></canvas>
      </div>
    </div>
  )
}
