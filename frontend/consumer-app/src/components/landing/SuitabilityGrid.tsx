import SuitabilityCard from './SuitabilityCard'

const CARDS = [
  { icon: '\u2600\uFE0F', label: 'Solar Irradiance', value: 'Sun Hours & Climate Index' },
  { icon: '\u{1F4D0}', label: 'Obstruction Analysis', value: 'Shadow-Free Usable Area' },
  { icon: '\u{1F9ED}', label: 'Compass Azimuth', value: 'South-Facing Orientation' },
  { icon: '\u26A1', label: 'Generation Yield', value: 'High-Efficiency Monocrystalline' },
]

export default function SuitabilityGrid() {
  return (
    <div className="suitability-insights-grid scene-element step-6">
      {CARDS.map((card) => (
        <SuitabilityCard
          key={card.label}
          icon={card.icon}
          label={card.label}
          value={card.value}
        />
      ))}
    </div>
  )
}
