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
        padding: 30,
        background: 'linear-gradient(0deg, rgba(6,15,31,0.9) 0%, transparent 100%)',
        textAlign: 'left',
      }}
    >
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{description}</p>
    </div>
  )
}
