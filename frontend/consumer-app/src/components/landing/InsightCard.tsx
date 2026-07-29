interface InsightCardProps {
  text: string
}

export default function InsightCard({ text }: InsightCardProps) {
  return (
    <p className="result-insight-note result-reveal">{text}</p>
  )
}
