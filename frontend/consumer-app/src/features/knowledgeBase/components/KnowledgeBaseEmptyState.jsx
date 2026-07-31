import React from 'react'

export default function KnowledgeBaseEmptyState({
  icon = 'icon-book',
  title = 'No documents found',
  description = 'Try adjusting your search terms or clearing the active filters.',
  action,
}) {
  return (
    <div className="kb-empty-state">
      <div className="kb-empty-state-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <use href={`#${icon}`} />
        </svg>
      </div>
      <h3 className="kb-empty-state-title">{title}</h3>
      {description ? (
        <p className="kb-empty-state-description">{description}</p>
      ) : null}
      {action ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={action.onClick} aria-label={action.label}>
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
