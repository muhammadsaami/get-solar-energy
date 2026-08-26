interface GalleryOverlayProps {
  title: string
  description: string
}

export default function GalleryOverlay({ title, description }: GalleryOverlayProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: '36px 24px 24px 24px',
        background: 'linear-gradient(0deg, rgba(6, 15, 31, 0.95) 0%, rgba(6, 15, 31, 0.75) 60%, transparent 100%)',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#f8fafc' }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>{description}</p>
    </div>
  )
}
