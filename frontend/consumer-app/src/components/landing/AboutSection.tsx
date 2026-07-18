import SocialLinks from './SocialLinks'

export default function AboutSection() {
  return (
    <div className="footer-about">
      <div
        className="logo-container logo-footer"
        style={{ cursor: 'default' }}
      >
        <div className="logo-badge">
          <svg
            className="logo-badge-svg"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100" height="100" rx="20" fill="#ffffff" />
            <text
              x="50"
              y="62"
              textAnchor="middle"
              fontFamily="'Outfit', sans-serif"
              fontWeight="900"
              fontSize="42"
              fill="#0f172a"
            >
              G
            </text>
          </svg>
        </div>
        <span className="logo-title-text text-light">GET SOLAR ENERGY</span>
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
