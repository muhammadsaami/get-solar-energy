interface RecommendationBadgeProps {
  text: string
}

export default function RecommendationBadge({ text }: RecommendationBadgeProps) {
  return (
    <div className="recommendation-badge">
      <span className="pulse-dot" aria-hidden="true" />
      {text}
    </div>
  )
}
