const METRICS = [
  'PM Surya Ghar Standardized',
  'DISCOM Net-Metering Compliant',
  '25-Year Linear Output Warranty',
]

export default function PlatformMetrics() {
  return (
    <div className="footer-nav-col">
      <h5 className="footer-nav-title">Platform Metrics</h5>
      {METRICS.map((metric) => (
        <span key={metric} className="footer-metric-item">
          {metric}
        </span>
      ))}
    </div>
  )
}
