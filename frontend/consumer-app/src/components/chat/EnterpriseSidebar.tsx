import React from 'react'
import type { TimelineStep, ToolResult } from '../../types/chat'

interface EnterpriseSidebarProps {
  toolResults: ToolResult[]
  timeline: TimelineStep[]
  context: { intent: string; confidence: number } | null
}

const cardTheme = { '--card-theme': '124, 93, 250' } as React.CSSProperties
const cardStyle: React.CSSProperties = { padding: '14px' }
const headingStyle: React.CSSProperties = { margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-navy)' }
const contentStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--text-secondary)' }
const emptyStyle: React.CSSProperties = { opacity: 0.5, fontStyle: 'italic' }

const dotColor: Record<string, string> = {
  done: '#36d399',
  running: '#7c5dfa',
  pending: 'var(--text-muted)',
  error: '#f43f5e',
}

export default function EnterpriseSidebar({ toolResults, timeline, context }: EnterpriseSidebarProps) {
  return (
    <>
      <div className="card-base" style={{ ...cardTheme, ...cardStyle }}>
        <h4 style={headingStyle}>AI Thinking</h4>
        <div style={contentStyle}>
          {timeline.length === 0 ? (
            <div style={emptyStyle}>Waiting for request...</div>
          ) : (
            timeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor[step.status] || 'var(--text-muted)', flexShrink: 0 }} />
                <span>{step.label}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card-base" style={{ ...cardTheme, ...cardStyle }}>
        <h4 style={headingStyle}>Tool Activity</h4>
        <div style={{ ...contentStyle, minHeight: '60px' }}>
          {toolResults.length === 0 ? (
            <div style={emptyStyle}>No tools executed yet</div>
          ) : (
            toolResults.map((tr, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: tr.success ? '#36d399' : '#f43f5e', fontWeight: 'bold' }}>{tr.success ? '\u2713' : '\u2717'}</span>
                <span>{tr.tool}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '10px' }}>{tr.latency_ms || 0}ms</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card-base" style={{ ...cardTheme, ...cardStyle }}>
        <h4 style={headingStyle}>Context</h4>
        <div style={{ ...contentStyle, minHeight: '40px' }}>
          {!context ? (
            <div style={emptyStyle}>No context loaded</div>
          ) : (
            <>
              {context.intent && <div style={{ marginBottom: '2px' }}>Intent: {context.intent}</div>}
              {context.confidence && <div style={{ marginBottom: '2px' }}>Confidence: {(context.confidence * 100).toFixed(0)}%</div>}
            </>
          )}
        </div>
      </div>
    </>
  )
}
