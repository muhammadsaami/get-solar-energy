import React from 'react'
import { MdSearch } from 'react-icons/md'

export default function SearchBar({ value, onChange }) {
  return (
    <div className="form-search kb-search-form">
      <MdSearch className="form-search-icon" size={16} />
      <input
        className="form-input"
        type="search"
        placeholder="Search documents, guides, SOPs..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search knowledge base"
      />
    </div>
  )
}
