import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import SavingsStats from './SavingsStats'
import { trackCTA } from '../../utils/analytics'

export default function SavingsScene() {
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'savings' })


  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-savings"
      id="sceneSavings"
      data-camera="savings"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/frontend/assets/Cinematic/Asset 6.webp"
          alt="Neighborhood Solar Scale"
          id="savingsParallaxImg"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-cool" />

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: 'rgba(13,33,54,0.6)',
            backdropFilter: 'blur(16px)',
            padding: 50,
            borderRadius: 'var(--radius-lg)',
            maxWidth: 550,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <h2
            className="section-title"
            style={{ textAlign: 'left', fontSize: 42 }}
          >
            Scale Your Savings.
          </h2>
          <p
            className="section-subtitle"
            style={{ textAlign: 'left', marginBottom: 30 }}
          >
            Join thousands of Indian families who have eliminated their
            electricity bills and secured their energy independence.
          </p>

          <SavingsStats />

          <a
            href="#sceneFinal"
            className="btn-hero-primary"
            onClick={() => trackCTA('savings_scene_cta')}
          >
            Calculate Your Share
          </a>
        </div>
      </div>
    </article>
  )
}
