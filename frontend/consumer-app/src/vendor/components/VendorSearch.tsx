import React, { useState } from 'react'

interface VendorSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function VendorSearch({ onSearch, placeholder = 'Search projects, customers, inventory, payments...' }: VendorSearchProps) {
  const [query, setQuery] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (onSearch) onSearch(val)
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
      <svg style={{
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
        width: '16px', height: '16px', stroke: 'var(--vendor-text-muted)', fill: 'none', strokeWidth: 2
      }} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 14px 9px 38px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--vendor-border)',
          borderRadius: '10px',
          color: '#FFFFFF',
          fontSize: '12px',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--vendor-primary)'
          e.target.style.backgroundColor = 'rgba(23, 168, 229, 0.08)'
          e.target.style.boxShadow = '0 0 16px rgba(23, 168, 229, 0.25)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--vendor-border)'
          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

export default VendorSearch
