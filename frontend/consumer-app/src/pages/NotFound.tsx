import { Link } from 'react-router-dom'
import { ROUTES } from '../config/routes'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '60px 40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            fontSize: '72px',
            fontWeight: '900',
            color: 'var(--color-orange)',
            lineHeight: 1,
            marginBottom: '8px',
          }}
        >
          404
        </div>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontWeight: '700',
          }}
        >
          Page Not Found
        </p>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          to={ROUTES.HOME}
          style={{
            background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
            color: 'white',
            textDecoration: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '15px',
            display: 'inline-block',
            boxShadow: '0 8px 30px rgba(255, 138, 29, 0.25)',
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
