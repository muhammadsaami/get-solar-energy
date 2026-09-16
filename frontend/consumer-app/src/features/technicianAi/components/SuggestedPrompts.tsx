import React from 'react'
import type { SuggestedPrompt } from '../types/technicianAi.types'
import { SUGGESTED_PROMPTS } from '../constants/technicianAi.constants'
import { MdFlashOn } from 'react-icons/md'

interface SuggestedPromptsProps {
  onSelectPrompt: (promptText: string, errorCode?: string) => void
}

export default function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  return (
    <div className="sidebar-panel">
      <h3 className="sidebar-panel-title">
        <MdFlashOn style={{ color: '#00aeef' }} /> Suggested Field Diagnostics
      </h3>

      <div className="suggested-prompts-grid">
        {SUGGESTED_PROMPTS.map((item: SuggestedPrompt) => (
          <div
            key={item.id}
            className="suggested-prompt-card"
            onClick={() => onSelectPrompt(item.prompt, item.errorCode)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectPrompt(item.prompt, item.errorCode)
              }
            }}
          >
            <h4 className="suggested-prompt-title">{item.title}</h4>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
              Category: {item.category}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
