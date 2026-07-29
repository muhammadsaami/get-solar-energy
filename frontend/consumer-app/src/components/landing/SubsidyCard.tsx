import { formatInrCompact } from '../../utils/solar'

interface SubsidyCardProps {
  amount: number
}

export default function SubsidyCard({ amount }: SubsidyCardProps) {
  return (
    <div className="subsidy-eligibility-card result-reveal">
      <div className="subsidy-card-left">
        <span className="subsidy-icon" aria-hidden="true">
          {'\u{1F3DB}\uFE0F'}
        </span>
        <div className="subsidy-body">
          <div className="subsidy-title">PM Surya Ghar Subsidy</div>
          <div className="subsidy-amount">{formatInrCompact(amount)}</div>
        </div>
      </div>
      <div className="subsidy-eligible-badge">
        <span className="eligible-dot" aria-hidden="true" />
        Eligible
      </div>
    </div>
  )
}
