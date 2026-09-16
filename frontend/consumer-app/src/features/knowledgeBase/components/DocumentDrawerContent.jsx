import React from 'react'
import { MdBookmark, MdBookmarkBorder, MdDownload, MdShare, MdAccessTime, MdStar, MdPerson, MdCloudOff } from 'react-icons/md'
import RelatedDocuments from './RelatedDocuments'

const CATEGORY_BADGE = {
  Safety: 'badge-error',
  Installation: 'badge-info',
  Technical: 'badge-orange',
  Compliance: 'badge-purple',
}

export default function DocumentDrawerContent({ document, relatedDocuments, onBookmark, onDownload, onShare, onOpenRelated }) {
  const categoryBadge = CATEGORY_BADGE[document.category] || 'badge-neutral'

  return (
    <div>
      <div className="kb-doc-badge-row">
        <span className={`badge badge-sm ${categoryBadge}`}>{document.category}</span>
        <span className="badge badge-sm badge-neutral">{document.difficulty}</span>
        {document.featured ? <span className="badge badge-sm badge-solid-orange">Featured</span> : null}
        {document.offline ? (
          <span className="badge badge-sm badge-neutral kb-doc-meta-item">
            <MdCloudOff size={11} /> Offline
          </span>
        ) : null}
      </div>

      <p className="kb-doc-summary">{document.summary}</p>

      <div className="kb-doc-meta kb-doc-meta-lg">
        <span className="kb-doc-meta-item">
          <MdAccessTime size={14} /> {document.readingTime} min read
        </span>
        <span className="kb-doc-meta-item">
          <MdPerson size={14} /> {document.author}
        </span>
        <span className="kb-doc-meta-item">
          <MdStar size={14} style={{ color: 'var(--color-yellow)' }} /> {document.rating.toFixed(1)}
        </span>
      </div>

      <div className="kb-doc-action-row">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onBookmark(document)}>
          {document.bookmarked ? <MdBookmark size={15} className="kb-btn-icon" /> : <MdBookmarkBorder size={15} className="kb-btn-icon" />}
          {document.bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => onDownload(document)}>
          <MdDownload size={15} className="kb-btn-icon" /> Download
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onShare(document)}>
          <MdShare size={15} className="kb-btn-icon" /> Share
        </button>
      </div>

      <div className="kb-doc-section">
        <h3 className="kb-doc-section-title">About this document</h3>
        <div className="kb-doc-stat-grid">
          <div className="kb-doc-stat">
            <span className="kb-doc-stat-label">Equipment</span>
            <span className="kb-doc-stat-value">{document.equipment !== 'None' ? document.equipment : 'General'}</span>
          </div>
          <div className="kb-doc-stat">
            <span className="kb-doc-stat-label">Last Updated</span>
            <span className="kb-doc-stat-value">{document.updatedAt}</span>
          </div>
          <div className="kb-doc-stat">
            <span className="kb-doc-stat-label">Downloads</span>
            <span className="kb-doc-stat-value">{document.downloads.toLocaleString('en-IN')}</span>
          </div>
          <div className="kb-doc-stat">
            <span className="kb-doc-stat-label">Views</span>
            <span className="kb-doc-stat-value">{document.views.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="kb-doc-section">
        <h3 className="kb-doc-section-title">Tags</h3>
        <div className="kb-doc-tags">
          {document.tags.map((tag) => (
            <span key={tag} className="badge badge-sm badge-neutral">{tag}</span>
          ))}
        </div>
      </div>

      <RelatedDocuments documents={relatedDocuments} onOpen={onOpenRelated} />
    </div>
  )
}
