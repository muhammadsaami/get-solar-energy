import React from 'react'
import { MdSend } from 'react-icons/md'

interface MessageComposerProps {
  query: string
  onQueryChange: (q: string) => void
  onSend: (query: string) => void
  sending?: boolean
}

export default function MessageComposer({
  query,
  onQueryChange,
  onSend,
  sending,
}: MessageComposerProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(query)
  }

  return (
    <form className="ai-composer-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="ai-composer-input"
        placeholder="Ask AI assistant about an error code, DC voltage drop, or DISCOM fault..."
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        disabled={sending}
        aria-label="Field diagnostic query input"
      />
      <button
        type="submit"
        className="btn btn-primary"
        disabled={sending || !query.trim()}
        aria-label="Send query to AI"
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <MdSend /> {sending ? 'Analyzing...' : 'Send'}
      </button>
    </form>
  )
}
