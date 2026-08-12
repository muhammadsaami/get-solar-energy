import React from 'react'

interface VendorBrandLogoProps {
  collapsed?: boolean
}

export function VendorBrandLogo({ collapsed = false }: VendorBrandLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', userSelect: 'none' }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#06111f',
        border: '1px solid rgba(23, 168, 229, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(23, 168, 229, 0.35)',
        flexShrink: 0,
        transition: 'transform 0.2s ease',
      }}>
        <svg
          style={{ width: '36px', height: '36px' }}
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="GET Solar Energy Logo"
        >
          <defs>
            <clipPath id="vendor-brand-lh">
              <rect x="0" y="0" width="50" height="100" />
            </clipPath>
            <clipPath id="vendor-brand-rh">
              <rect x="50" y="0" width="50" height="100" />
            </clipPath>
          </defs>
          <rect width="100" height="100" rx="20" fill="#06111f" />
          <g clipPath="url(#vendor-brand-lh)">
            <circle cx="50" cy="50" r="38" stroke="#17A8E5" strokeWidth="5" strokeDasharray="6 4.5" />
            <circle cx="50" cy="50" r="30" stroke="#17A8E5" strokeWidth="5" strokeDasharray="5.5 4" />
            <circle cx="50" cy="50" r="22" stroke="#17A8E5" strokeWidth="5" strokeDasharray="4.5 4" />
          </g>
          <g clipPath="url(#vendor-brand-rh)">
            <circle cx="50" cy="50" r="38" stroke="#F97316" strokeWidth="5" strokeDasharray="6 4.5" />
            <circle cx="50" cy="50" r="30" stroke="#F97316" strokeWidth="5" strokeDasharray="5.5 4" />
            <circle cx="50" cy="50" r="22" stroke="#F97316" strokeWidth="5" strokeDasharray="4.5 4" />
          </g>
          <circle cx="50" cy="50" r="14" fill="#ffffff" />
          <text
            x="50" y="55" textAnchor="middle"
            fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#06111f"
          >
            G
          </text>
        </svg>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{
            fontSize: '15.5px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '0.04em',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.15
          }}>
            GET SOLAR ENERGY
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: 'var(--vendor-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: "'Outfit', sans-serif"
            }}>
              Vendor Portal
            </span>
            <span style={{ fontSize: '10px', color: 'var(--vendor-text-muted)' }}>•</span>
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              color: 'var(--vendor-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Solar Intelligence Platform
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorBrandLogo
