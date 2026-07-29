const LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

export default function LegalLinks() {
  return (
    <div className="footer-nav-col">
      <h5 className="footer-nav-title">Legal</h5>
      {LINKS.map((link) => (
        <a key={link.label} href={link.href}>
          {link.label}
        </a>
      ))}
    </div>
  )
}
