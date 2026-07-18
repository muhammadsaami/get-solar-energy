const METRICS = [
  '25,000+ Bills Processed',
  '8,000+ Homes Assessed',
  '120 MW Potential Identified',
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
