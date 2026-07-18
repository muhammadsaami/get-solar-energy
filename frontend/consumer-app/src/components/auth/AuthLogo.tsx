interface AuthLogoProps {
  id?: string
  showTagline?: boolean
}

export default function AuthLogo({ id = 'auth', showTagline = true }: AuthLogoProps) {
  const clipLeft = `lh-${id}`
  const clipRight = `rh-${id}`

  return (
    <div className="auth-logo">
      <div className="auth-logo-badge">
        <svg
          className="auth-logo-svg"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="GET Solar Energy Logo"
        >
          <defs>
            <clipPath id={clipLeft}>
              <rect x="0" y="0" width="50" height="100" />
            </clipPath>
            <clipPath id={clipRight}>
              <rect x="50" y="0" width="50" height="100" />
            </clipPath>
          </defs>
          <rect width="100" height="100" rx="20" fill="#000000" />
          <g clipPath={`url(#${clipLeft})`}>
            <circle cx="50" cy="50" r="38" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="6 4.5" />
            <circle cx="50" cy="50" r="30" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="5.5 4" />
            <circle cx="50" cy="50" r="22" stroke="#00aeef" strokeWidth="4.5" strokeDasharray="4.5 4" />
          </g>
          <g clipPath={`url(#${clipRight})`}>
            <circle cx="50" cy="50" r="38" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="6 4.5" />
            <circle cx="50" cy="50" r="30" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="5.5 4" />
            <circle cx="50" cy="50" r="22" stroke="#f7931e" strokeWidth="4.5" strokeDasharray="4.5 4" />
          </g>
          <circle cx="50" cy="50" r="14" fill="#ffffff" />
          <text
            x="50" y="55" textAnchor="middle"
            fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#000000"
          >
            G
          </text>
        </svg>
      </div>
      <div className="auth-logo-text">
        <span className="auth-brand-name">GET SOLAR ENERGY</span>
        {showTagline && <span className="auth-brand-tagline">SOLAR INTELLIGENCE PLATFORM</span>}
      </div>
    </div>
  )
}
