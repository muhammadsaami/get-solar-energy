export default function RoofVisualization() {
  return (
    <div className="suitability-visual-column" style={{ flex: 1 }}>
      <div className="cinematic-roof-scene" id="cinematicRoofScene">
        <div className="scene-sunlight-sweep" />
        <div className="scene-roof-highlight">
          <svg
            viewBox="0 0 400 300"
            className="roof-polygon-svg"
            preserveAspectRatio="none"
          >
            <polygon
              points="120,80 280,60 350,140 100,180"
              className="roof-plane-fill"
            />
          </svg>
        </div>
        <div className="scene-solar-panels">
          <div className="panel-grid-overlay" />
        </div>
        <div className="scene-energy-flow">
          <div className="energy-line line-1" />
          <div className="energy-line line-2" />
          <div className="energy-line line-3" />
        </div>
      </div>
    </div>
  )
}
