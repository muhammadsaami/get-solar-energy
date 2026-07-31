import React from 'react'
import {
  MdBookmark, MdBookmarkBorder, MdDownload, MdShare, MdAccessTime,
  MdStar, MdCloudOff, MdMenuBook, MdAssignment, MdWarningAmber, MdGavel,
} from 'react-icons/md'

const CATEGORY_BADGE = {
  Safety: 'badge-error',
  Installation: 'badge-info',
  Technical: 'badge-orange',
  Compliance: 'badge-purple',
}

const CATEGORY_ICON = {
  Safety: MdWarningAmber,
  Installation: MdAssignment,
  Technical: MdMenuBook,
  Compliance: MdGavel,
}

const DIFFICULTY_COLOR = {
  Beginner: 'var(--color-green)',
  Intermediate: 'var(--color-blue)',
  Advanced: 'var(--color-orange)',
}

export default function DocumentCard({ document, onOpen, onBookmark, onDownload, onShare }) {
  const categoryBadge = CATEGORY_BADGE[document.category] || 'badge-neutral'
  const CategoryIcon = CATEGORY_ICON[document.category] || MdMenuBook
  const difficultyColor = DIFFICULTY_COLOR[document.difficulty] || 'var(--text-muted)'

  return (
    <div className="card-base kb-doc-card" style={{ '--card-theme': '23, 168, 229' }}>
      <div className="kpi-header-row" style={{ alignItems: 'flex-start' }}>
        <div className="kb-doc-card-badges">
          <span className={`badge badge-sm ${categoryBadge}`}>{document.category}</span>
          {document.featured ? <span className="badge badge-sm badge-solid-orange">Featured</span> : null}
          {document.offline ? (
            <span className="badge badge-sm badge-neutral kb-doc-meta-item">
              <MdCloudOff size={11} /> Offline
            </span>
          ) : null}
        </div>
        <div className="kb-doc-card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={() => onBookmark(document)}
            aria-label={document.bookmarked ? 'Remove bookmark' : 'Bookmark document'}
            title={document.bookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{ color: document.bookmarked ? 'var(--color-purple)' : 'var(--text-muted)' }}
          >
            {document.bookmarked ? <MdBookmark size={17} /> : <MdBookmarkBorder size={17} />}
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => onDownload(document)} aria-label="Download document" title="Download">
            <MdDownload size={17} />
          </button>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => onShare(document)} aria-label="Share document" title="Share">
            <MdShare size={17} />
          </button>
        </div>
      </div>

      <button type="button" className="kb-doc-card-title" onClick={() => onOpen(document)} aria-label={`Open ${document.title}`}>
        <CategoryIcon size={15} style={{ color: 'var(--color-blue)', marginRight: 6, verticalAlign: -2 }} />
        {document.title}
      </button>
      <p className="kb-doc-card-summary">{document.summary}</p>

      <div className="kb-doc-meta">
        <span className="kb-doc-meta-item difficulty" style={{ color: difficultyColor }}>{document.difficulty}</span>
        <span className="kb-doc-meta-item">
          <CategoryIcon size={12} /> {document.equipment !== 'None' ? document.equipment : 'General'}
        </span>
        <span className="kb-doc-meta-item">
          <MdAccessTime size={12} /> {document.readingTime} min
        </span>
        <span className="kb-doc-meta-item">
          <MdStar size={12} style={{ color: 'var(--color-yellow)' }} /> {document.rating.toFixed(1)}
        </span>
      </div>

      <div className="kb-doc-card-footer">
        <div className="kb-doc-tags">
          {document.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="badge badge-sm badge-neutral">{tag}</span>
          ))}
        </div>
        <span className="kb-doc-updated">
          {document.author} · Updated {document.updatedAt}
        </span>
      </div>
    </div>
  )
}
