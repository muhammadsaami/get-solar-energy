import SocialLinks from './SocialLinks'
import OfficialLogo from '../brand/OfficialLogo'

export default function AboutSection() {
  return (
    <div className="footer-about">
      <div
        className="logo-container logo-footer"
        style={{ cursor: 'default' }}
      >
        <OfficialLogo height={36} />
      </div>
      <p className="footer-about-text">
        India's premier solar intelligence platform helping residential
        homeowners navigate solar sizing, subsidy checks, and vendor
        connections.
      </p>
      <p className="footer-statement-text">
        Built for Indian homeowners, businesses, solar partners, and financial
        institutions.
      </p>
      <SocialLinks />
    </div>
  )
}
