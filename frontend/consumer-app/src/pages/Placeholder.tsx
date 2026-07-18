interface PlaceholderProps {
  title: string
  description?: string
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 40px',
        minHeight: '400px',
        textAlign: 'center',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '40px',
          maxWidth: '500px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 24, 42, 0.72)',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            marginBottom: '20px',
          }}
        >
          🚧
        </div>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '12px',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
        {description && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: 0,
            }}
          >
            {description}
          </p>
        )}
        {!description && (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: 0,
            }}
          >
            This feature is coming soon. Check back in the next phase.
          </p>
        )}
      </div>
    </div>
  )
}
