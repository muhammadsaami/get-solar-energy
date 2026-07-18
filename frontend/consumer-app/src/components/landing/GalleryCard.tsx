import GalleryOverlay from './GalleryOverlay'

interface GalleryCardProps {
  image: string
  alt: string
  title: string
  description: string
}

export default function GalleryCard({ image, alt, title, description }: GalleryCardProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '4/5',
      }}
    >
      <img
        src={image}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <GalleryOverlay title={title} description={description} />
    </div>
  )
}
