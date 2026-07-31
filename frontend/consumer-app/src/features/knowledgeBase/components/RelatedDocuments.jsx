import React from 'react'
import { MdLink } from 'react-icons/md'

export default function RelatedDocuments({ documents, onOpen }) {
  if (!documents || documents.length === 0) return null

  return (
    <div className="kb-related">
      <h3 className="kb-doc-section-title">
        <MdLink size={14} className="kb-related-icon" />
        Related Documents
      </h3>
      <div className="kb-related-list">
        {documents.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className="kb-related-item"
            onClick={() => onOpen(doc)}
          >
            <span className="kb-related-item-text">
              <span className="kb-related-item-title">{doc.title}</span>
              <span className="kb-related-item-meta">
                {doc.category} · {doc.readingTime} min
              </span>
            </span>
            <MdLink size={14} className="kb-related-item-link" />
          </button>
        ))}
      </div>
    </div>
  )
}
