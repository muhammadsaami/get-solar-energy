import { trackCTA } from '../../utils/analytics'

const LINKS = [
  { label: 'Energy Bill Analyzer', action: 'link_bill_analyzer' },
  { label: 'Solar Roof Analyzer', action: 'link_roof_analyzer' },
  { label: 'ROI Calculator', action: 'link_roi_calculator' },
  { label: 'Solar Intelligence Assistant', action: 'link_solar_assistant' },
  { label: 'Rewards Program', action: 'link_rewards' },
]

export default function QuickLinks() {
  return (
    <div className="footer-nav-col">
      <h5 className="footer-nav-title">Quick Links</h5>
      {LINKS.map((link) => (
        <a
          key={link.action}
          href="/signup"
          onClick={() =>
            trackCTA({
              action: link.action,
              location: 'footer',
              timestamp: Date.now(),
            })
          }
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
