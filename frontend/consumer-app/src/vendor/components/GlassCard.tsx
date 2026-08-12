import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  themeColor?: string
}

export function GlassCard({ children, className = '', style = {}, themeColor }: GlassCardProps) {
  const cardStyle: React.CSSProperties = {
    ...(themeColor ? ({ '--card-theme': themeColor } as React.CSSProperties) : {}),
    ...style,
  }

  return (
    <div className={`vendor-glass-card ${className}`} style={cardStyle}>
      {children}
    </div>
  )
}

export default GlassCard
