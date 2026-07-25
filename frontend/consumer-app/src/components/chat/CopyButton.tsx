import React, { useState } from 'react'

interface CopyButtonProps {
  content: string
}

export default function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard write failed silently
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy message'}
      title={copied ? 'Copied' : 'Copy'}
      style={{
        position: 'absolute',
        bottom: '22px',
        right: '-22px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        color: 'var(--text-muted)',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="chat-copy-btn"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}
