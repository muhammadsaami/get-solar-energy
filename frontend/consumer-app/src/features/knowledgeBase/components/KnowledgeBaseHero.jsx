import React from 'react'
import SearchBar from './SearchBar'
import KnowledgeScoreCard from './KnowledgeScoreCard'

export default function KnowledgeBaseHero({ score, queryText, onQueryChange }) {
  return (
    <div className="tab-header-block">
      <h2 className="tab-heading">Knowledge Base</h2>
      <p className="tab-subheading">Searchable library of solar installation guides, safety SOPs, technical manuals, and compliance references.</p>

      <div className="kb-hero-layout">
        <div className="card-base kb-hero-search-card" style={{ '--card-theme': '23, 168, 229' }}>
          <span className="kpi-title kb-hero-search-heading">Search the Library</span>
          <SearchBar value={queryText} onChange={onQueryChange} />
          <div className="kb-hero-tag-row">
            <span className="badge badge-sm badge-info">Safety SOPs</span>
            <span className="badge badge-sm badge-info">Installation Guides</span>
            <span className="badge badge-sm badge-info">Compliance Docs</span>
          </div>
        </div>

        <KnowledgeScoreCard score={score} />
      </div>
    </div>
  )
}
