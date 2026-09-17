import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

export default function RoofVisualization() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div
      className="suitability-visual-column"
      style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 280,
      }}
      role="region"
      aria-label="Illustrative Rooftop Solar Layout Visualization"
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(6, 17, 34, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header HUD Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <motion.span
              animate={shouldReduceMotion ? {} : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00d2ff',
                boxShadow: '0 0 8px #00d2ff',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#e2e8f0',
                textTransform: 'uppercase',
              }}
            >
              Rooftop Layout Schematic
            </span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              background: 'rgba(0, 210, 255, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(0, 210, 255, 0.4)',
              letterSpacing: '0.02em',
            }}
          >
            True South Azimuth
          </span>
        </div>

        {/* Blueprint SVG Diagram */}
        <svg
          viewBox="0 0 400 280"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          aria-label="Illustrative rooftop solar panel blueprint layout"
          role="img"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern
              id="blueprintGrid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
              />
            </pattern>

            {/* Sun Rays Gradient */}
            <linearGradient id="sunRayGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>

            {/* Solar Panel Gradient */}
            <linearGradient id="solarPanelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0c2d48" />
              <stop offset="50%" stopColor="#001e3d" />
              <stop offset="100%" stopColor="#051429" />
            </linearGradient>

            {/* Panel Grid Cell */}
            <pattern
              id="panelGrid"
              width="6"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <rect
                width="5.5"
                height="9.5"
                fill="none"
                stroke="#00d2ff"
                strokeWidth="0.5"
                strokeOpacity="0.35"
              />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="400" height="280" fill="url(#blueprintGrid)" />

          {/* Sun Irradiance Rays with Subtle Ambient Motion */}
          <motion.g
            animate={shouldReduceMotion ? { opacity: 0.8 } : { opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path
              d="M 40 20 L 160 140 L 130 180 Z"
              fill="url(#sunRayGrad)"
            />
            <path
              d="M 60 10 L 260 130 L 220 180 Z"
              fill="url(#sunRayGrad)"
            />
          </motion.g>

          {/* Sun Position Indicator */}
          <g transform="translate(45, 30)">
            <circle cx="0" cy="0" r="14" fill="#f59e0b" fillOpacity="0.2" />
            <circle cx="0" cy="0" r="8" fill="#f59e0b" />
            <line x1="-18" y1="0" x2="18" y2="0" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2 2" />
            <line x1="0" y1="-18" x2="0" y2="18" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2 2" />
            <text x="22" y="4" fill="#f59e0b" fontSize="10" fontWeight="600" fontFamily="sans-serif">Solar Path</text>
          </g>

          {/* Roof Structure Outline (Isometric Pitch) */}
          <motion.polygon
            points="70,180 200,80 330,180 200,240"
            fill="rgba(15, 30, 55, 0.65)"
            stroke="rgba(0, 210, 255, 0.4)"
            strokeWidth="1.5"
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6 }}
          />

          {/* Roof Ridge Line */}
          <line
            x1="200"
            y1="80"
            x2="200"
            y2="240"
            stroke="rgba(0, 210, 255, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* Solar Panel Array on South Pitch (Left-Center Face) */}
          <motion.g
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.2 }}
          >
            {/* Row 1 */}
            <polygon points="120,165 155,140 185,152 150,178" fill="url(#solarPanelGrad)" stroke="#00d2ff" strokeWidth="1" />
            <polygon points="120,165 155,140 185,152 150,178" fill="url(#panelGrid)" />

            <polygon points="158,138 193,113 223,125 188,150" fill="url(#solarPanelGrad)" stroke="#00d2ff" strokeWidth="1" />
            <polygon points="158,138 193,113 223,125 188,150" fill="url(#panelGrid)" />

            {/* Row 2 */}
            <polygon points="145,185 180,160 210,172 175,198" fill="url(#solarPanelGrad)" stroke="#00d2ff" strokeWidth="1" />
            <polygon points="145,185 180,160 210,172 175,198" fill="url(#panelGrid)" />

            <polygon points="183,158 218,133 248,145 213,170" fill="url(#solarPanelGrad)" stroke="#00d2ff" strokeWidth="1" />
            <polygon points="183,158 218,133 248,145 213,170" fill="url(#panelGrid)" />
          </motion.g>

          {/* Compass Rose in Corner */}
          <g transform="translate(345, 50)">
            <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            <polygon points="0,-16 -4,-2 0,0" fill="#ef4444" />
            <polygon points="0,-16 4,-2 0,0" fill="#dc2626" />
            <polygon points="0,16 -4,2 0,0" fill="rgba(255,255,255,0.4)" />
            <polygon points="0,16 4,2 0,0" fill="rgba(255,255,255,0.2)" />
            <text x="-3" y="-18" fill="#ef4444" fontSize="9" fontWeight="800" fontFamily="sans-serif">N</text>
            <text x="-3" y="27" fill="#cbd5e1" fontSize="9" fontWeight="700" fontFamily="sans-serif">S</text>
          </g>

          {/* Annotation Dimension Leader Lines */}
          <g>
            <circle cx="168" cy="145" r="3" fill="#00d2ff" />
            <line x1="168" y1="145" x2="270" y2="215" stroke="#00d2ff" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="270" y="205" width="118" height="22" rx="4" fill="rgba(6, 17, 34, 0.95)" stroke="#00d2ff" strokeWidth="1" />
            <text x="278" y="220" fill="#38bdf8" fontSize="10.5" fontWeight="700" fontFamily="sans-serif">
              Monocrystalline Array
            </text>
          </g>
        </svg>

        {/* Footer Technical Legend */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '11px',
            fontWeight: 600,
            color: '#cbd5e1',
          }}
        >
          <span>Orientation: Optimal South Tilt</span>
          <span style={{ color: '#38bdf8' }}>Illustrative Layout</span>
        </div>
      </motion.div>
    </div>
  )
}
