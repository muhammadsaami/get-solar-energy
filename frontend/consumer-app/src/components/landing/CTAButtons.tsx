import { useAuthStatus } from '../../hooks/useAuthStatus'
import { trackCTA } from '../../utils/analytics'

export default function CTAButtons() {
  const { isAuthenticated } = useAuthStatus()

  return (
    <div
      className="final-buttons"
      style={{ display: 'flex', justifyContent: 'center', gap: 20 }}
    >
      <a
        href={isAuthenticated ? '/app/home' : '/signup'}
        className="btn-hero-primary"
        onClick={() => trackCTA({ action: 'final_assessment', location: 'scene_final', timestamp: Date.now() })}
        style={{ fontSize: 18, padding: '18px 40px' }}
      >
        Start Free Assessment
      </a>
      <a
        href={isAuthenticated ? '/app/home' : '/login'}
        className="btn-hero-secondary"
        onClick={() => trackCTA({ action: 'demo_dashboard', location: 'scene_final', timestamp: Date.now() })}
        style={{
          fontSize: 18,
          padding: '18px 40px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
      >
        View Demo Dashboard
      </a>
    </div>
  )
}
