import React from 'react'
import DocumentCard from './DocumentCard'
import DocumentSkeleton from './DocumentSkeleton'
import KnowledgeBaseEmptyState from './KnowledgeBaseEmptyState'

const SKELETON_COUNT = 6

export default function DocumentGrid({
  documents,
  loading,
  onOpen,
  onBookmark,
  onDownload,
  onShare,
  emptyState,
}) {
  if (loading) {
    return (
      <div className="kb-doc-grid">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <DocumentSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return <KnowledgeBaseEmptyState {...(emptyState || {})} />
  }

  return (
    <div className="kb-doc-grid">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onOpen={onOpen}
          onBookmark={onBookmark}
          onDownload={onDownload}
          onShare={onShare}
        />
      ))}
    </div>
  )
}
