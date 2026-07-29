export default function LoadingSkeleton() {
  return (
    <div className="shimmer-loading-block" aria-hidden="true">
      <div className="shimmer-skeleton">
        <div className="skeleton-line skeleton-wide" />
        <div className="skeleton-line skeleton-narrow" />
        <div className="skeleton-block" />
        <div className="skeleton-grid">
          <div className="skeleton-cell" />
          <div className="skeleton-cell" />
          <div className="skeleton-cell" />
          <div className="skeleton-cell" />
        </div>
      </div>
    </div>
  )
}
