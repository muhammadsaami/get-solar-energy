interface WhyCardProps {
  title: string
  description: string
}

export default function WhyCard({ title, description }: WhyCardProps) {
  return (
    <div
      className="why-card"
      style={{
        background: 'rgba(13,33,54,0.7)',
        backdropFilter: 'blur(10px)',
        padding: 24,
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <h3 className="why-card-title" style={{ marginBottom: 8 }}>
        {title}
      </h3>
      <p className="why-card-desc" style={{ fontSize: 14 }}>
        {description}
      </p>
    </div>
  )
}
