import AboutSection from './AboutSection'
import QuickLinks from './QuickLinks'
import PlatformMetrics from './PlatformMetrics'
import TrustSecurity from './TrustSecurity'
import LegalLinks from './LegalLinks'

export default function SiteFooter() {
  return (
    <footer className="footer-block">
      <div className="footer-container">
        <AboutSection />
        <QuickLinks />
        <PlatformMetrics />
        <TrustSecurity />
        <LegalLinks />
      </div>

      <div className="footer-boilerplate-section">
        <div className="footer-boilerplate-container">
          <span className="boilerplate-tagline">
            GET Solar Energy &mdash; India's Solar Intelligence & Service
            Ecosystem
          </span>
          <p className="boilerplate-subtext">
            Helping homeowners make smarter solar decisions through advanced
            analysis, rooftop intelligence, and financial forecasting.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 GET Solar Energy. All rights reserved.</p>
      </div>
    </footer>
  )
}
