const TRUST_ITEMS = ['Secure', 'Private', 'Trusted Across India']

export default function TrustSecurity() {
  return (
    <div className="footer-nav-col">
      <h5 className="footer-nav-title">Trust & Security</h5>
      {TRUST_ITEMS.map((item) => (
        <span key={item} className="footer-trust-badge">
          {item}
        </span>
      ))}
    </div>
  )
}
