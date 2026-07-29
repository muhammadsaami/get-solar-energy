import SuitabilityCard from './SuitabilityCard'

const CARDS = [
  { icon: '\u2600\uFE0F', label: 'Sunlight Available', value: 'High Exposure' },
  { icon: '\u{1F4D0}', label: 'Suitable Roof Space', value: '~380 sq ft' },
  { icon: '\u{1F9ED}', label: 'Roof Direction', value: 'South-Facing Ideal' },
  { icon: '\u26A1', label: 'Estimated Energy Production', value: '6,000 kWh/yr' },
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
