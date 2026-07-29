import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import TechnologyContent from './TechnologyContent'
import DiagnosticsGrid from './DiagnosticsGrid'

export default function TechnologyScene() {
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'technology' })


  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-technology"
      id="sceneTechnology"
      data-camera="technology"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/frontend/assets/Cinematic/Asset 5.webp"
          alt="Technology and QA Inspection"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-cool" />

      <div className="qa-container layer-fg scene-element">
        <TechnologyContent />
        <DiagnosticsGrid />
      </div>
    </article>
  )
}
