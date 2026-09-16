import React from 'react'

export default function DocumentSkeleton() {
  return (
    <div className="card-base kb-doc-card">
      <div className="kpi-header-row">
        <span className="skeleton-loader kb-skel kb-skel-badge" />
        <span className="skeleton-loader kb-skel kb-skel-icon" />
      </div>
      <div className="skeleton-loader kb-skel kb-skel-title" />
      <div className="skeleton-loader kb-skel kb-skel-line" />
      <div className="skeleton-loader kb-skel kb-skel-line" />
      <div className="skeleton-loader kb-skel kb-skel-line-short" />
    </div>
  )
}
