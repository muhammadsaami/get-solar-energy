import GalleryCard from './GalleryCard'

interface GalleryItem {
  image: string
  alt: string
  title?: string
  description: string
  footer?: string
}

interface GalleryGridProps {
  items: GalleryItem[]
}

export default function GalleryGrid({ items }: GalleryGridProps) {
  return (
    <div
      className="lifestyle-gallery layer-fg scene-element"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 1400,
        padding: '0 5%',
      }}
    >
      {items.map((item, index) => (
        <GalleryCard
          key={item.image || item.title || index}
          image={item.image}
          alt={item.alt}
          title={item.title}
          description={item.description}
          footer={item.footer}
        />
      ))}
    </div>
  )
}
