import React from 'react'
import { MdClose, MdFilterAlt } from 'react-icons/md'
import DashboardSprites from '../../components/dashboard/DashboardSprites'
import DocumentDrawer from '../../components/ui/DocumentDrawer'
import { useKnowledgeBase } from './hooks/useKnowledgeBase'
import KnowledgeBaseHero from './components/KnowledgeBaseHero'
import QuickAccessStrip from './components/QuickAccessStrip'
import FilterBar from './components/FilterBar'
import DocumentGrid from './components/DocumentGrid'
import DocumentDrawerContent from './components/DocumentDrawerContent'
import { FILTER_CONFIG } from './config/filterConfig'
import './styles/knowledge-base.css'

const ACTIVE_FILTER_LABELS = FILTER_CONFIG.reduce((map, filter) => {
  map[filter.id] = filter.options.reduce((optMap, opt) => {
    optMap[opt.value] = opt.label
    return optMap
  }, {})
  return map
}, {})

function labelForFilter(id, value) {
  if (id === 'bookmarked') return 'Bookmarked'
  if (id === 'offline') return 'Offline'
  return ACTIVE_FILTER_LABELS[id]?.[value] || value
}

export default function KnowledgeBase() {
  const kb = useKnowledgeBase()

  const handleBookmark = (doc) => kb.toggleBookmark(doc.id)
  const handleDownload = (doc) => kb.downloadDocument(doc.id)
  const handleShare = (doc) => kb.shareDocument(doc.id)

  const activeFilterEntries = Object.entries(kb.activeFilters || {}).flatMap(([id, values]) =>
    (values || []).map((value) => ({ id, value }))
  )

  const emptyState = kb.isSearchActive
    ? {
        icon: 'icon-folder',
        title: 'No matching documents',
        description: 'Try adjusting your search terms or clearing the active filters.',
        action: { label: 'Clear filters', onClick: kb.resetFilters },
      }
    : {
        icon: 'icon-book',
        title: 'The library is empty',
        description: 'Documents will appear here once they are published to the knowledge base.',
      }

  return (
    <>
      <DashboardSprites />
      <div className="tab-content active kb-page" role="tabpanel" aria-label="knowledge base" id="tab-knowledge-base">
        <KnowledgeBaseHero
          score={kb.dashboard?.score ?? 0}
          queryText={kb.queryText}
          onQueryChange={kb.setQueryText}
        />

        <QuickAccessStrip onSelect={(item) => kb.applyPreset(item.preset)} />

        <FilterBar
          activeFilters={kb.activeFilters}
          onFilterChange={kb.setFilter}
          onClear={kb.resetFilters}
        />

        {activeFilterEntries.length > 0 ? (
          <div className="kb-active-filters">
            <span className="kb-active-filters-label">
              <MdFilterAlt size={13} />
              Active filters:
            </span>
            {activeFilterEntries.map(({ id, value }) => (
              <span key={`${id}-${value}`} className="tag">
                {labelForFilter(id, value)}
                <button
                  type="button"
                  className="tag-remove"
                  aria-label={`Remove ${labelForFilter(id, value)} filter`}
                  onClick={() => kb.setFilter(id, kb.activeFilters[id].filter((v) => v !== value))}
                >
                  <MdClose size={12} />
                </button>
              </span>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={kb.resetFilters}>
              Clear All
            </button>
          </div>
        ) : null}

        {kb.error ? (
          <div className="card-base kb-error-card" style={{ '--card-theme': '244, 63, 94' }}>
            <p className="kb-error-text">{kb.error}</p>
            <button type="button" className="btn btn-outline btn-sm" onClick={kb.retry}>Retry</button>
          </div>
        ) : (
          <>
            <div className="kpi-header-row kb-results-header">
              <span className="kpi-title">
                {kb.isSearchActive ? 'Search Results' : 'Library'}
                <span className="kb-results-count">
                  {kb.loading ? 'Loading…' : `(${kb.searchResults.length})`}
                </span>
              </span>
              <label className="form-group kb-sort-group">
                <span className="form-label">Sort</span>
                <select
                  className="form-select"
                  value={kb.sortBy}
                  onChange={(e) => kb.setSortBy(e.target.value)}
                  aria-label="Sort documents"
                >
                  <option value="relevance">Relevance</option>
                  <option value="updated">Recently Updated</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Top Rated</option>
                </select>
              </label>
            </div>
            <DocumentGrid
              documents={kb.searchResults}
              loading={kb.loading}
              emptyState={emptyState}
              onOpen={(doc) => kb.openDocument(doc.id)}
              onBookmark={handleBookmark}
              onDownload={handleDownload}
              onShare={handleShare}
            />
          </>
        )}

        <DocumentDrawer
          open={kb.isDrawerOpen}
          title={kb.selectedDocument?.title || ''}
          subtitle={kb.selectedDocument
            ? `${kb.selectedDocument.category} · ${kb.selectedDocument.difficulty} · ${kb.selectedDocument.readingTime} min read`
            : undefined}
          onClose={kb.closeDocument}
        >
          {kb.selectedDocument ? (
            <DocumentDrawerContent
              document={kb.selectedDocument}
              relatedDocuments={kb.relatedDocuments}
              onBookmark={handleBookmark}
              onDownload={handleDownload}
              onShare={handleShare}
              onOpenRelated={(doc) => kb.openDocument(doc.id)}
            />
          ) : null}
        </DocumentDrawer>
      </div>
    </>
  )
}
