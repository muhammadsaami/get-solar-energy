import GalleryGrid from './GalleryGrid'

const GALLERY_ITEMS = [
  {
    image: '/frontend/assets/Cinematic/Asset 7.webp',
    alt: 'Smart Home Integration',
    title: 'Smart Home Ready',
    description: 'Seamlessly integrate with your existing smart devices.',
  },
  {
    image: '/frontend/assets/Cinematic/Asset 8.webp',
    alt: 'Family Comfort',
    title: '24/7 Comfort',
    description: 'Run your heavy appliances without worrying about the bill.',
  },
  {
    image: '/frontend/assets/Cinematic/Asset 9.webp',
    alt: 'Real-time Monitoring',
    title: 'Live Monitoring',
    description: 'Track generation and consumption in real-time.',
  },
  {
    image: '/frontend/assets/Cinematic/Asset 10.webp',
    alt: 'Battery Storage',
    title: 'Battery Backup',
    description: 'Optional storage solutions for true independence.',
  },
  {
    image: '/frontend/assets/Cinematic/Asset 11.webp',
    alt: 'Weather Resilience',
    title: 'Weather Proof',
    description: 'Engineered to withstand monsoons and high winds.',
  },
  {
    image: '/frontend/assets/Cinematic/Asset 13.webp',
    alt: 'Evening Transition',
    title: 'Grid Sync',
    description: 'Seamless net-metering ensures you never lose power.',
  },
]

export default function LifestyleGallery() {
  return (
    <article
      className="cinematic-scene scene-lifestyle"
      id="sceneLifestyle"
      data-camera="lifestyle"
      style={{
        padding: '100px 0',
        background: 'var(--bg-deep-blue)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1400,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginBottom: 60,
        }}
      >
        <h2 className="section-title">Powering the Modern Indian Home</h2>
        <p
          className="section-subtitle"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          From EV charging to uninterrupted AC during summer outages. Experience
          the peace of mind that comes with complete energy independence.
        </p>
      </div>

      <GalleryGrid items={GALLERY_ITEMS} />
    </article>
  )
}
