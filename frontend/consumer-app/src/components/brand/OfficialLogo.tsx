import React from 'react'

export interface OfficialLogoProps {
  height?: number | string
  maxWidth?: number | string
  collapsed?: boolean
  className?: string
  style?: React.CSSProperties
  alt?: string
}

export default function OfficialLogo({
  height = 38,
  maxWidth,
  collapsed = false,
  className = '',
  style = {},
  alt = "GET Solar Energy - India's Solar Intelligence & Service Ecosystem",
}: OfficialLogoProps) {
  const numHeight = typeof height === 'number' ? height : parseInt(String(height), 10) || 38

  if (collapsed) {
    return (
      <div
        className={`official-logo-collapsed ${className}`.trim()}
        style={{
          width: numHeight,
          height: numHeight,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexShrink: 0,
          ...style,
        }}
        title="GET Solar Energy"
      >
        <img
          src="/assets/logo.png"
          alt={alt}
          style={{
            height: numHeight,
            width: 'auto',
            maxWidth: 'none',
            display: 'block',
            objectFit: 'contain',
            objectPosition: 'left center',
          }}
        />
      </div>
    )
  }

  return (
    <img
      src="/assets/logo.png"
      alt={alt}
      className={`official-logo-img ${className}`.trim()}
      style={{
        height,
        width: 'auto',
        maxWidth: maxWidth || (numHeight ? numHeight * 6.5 : '240px'),
        objectFit: 'contain',
        display: 'block',
        ...style,
      }}
    />
  )
}
