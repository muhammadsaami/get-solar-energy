import React, { useState } from 'react'
import { useSolarAdvisor } from '../hooks/useSolarAdvisor'
import { SOLAR_ADVISOR_PROMPTS } from '../config/solarAdvisorPrompts'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import SuggestedPrompts from '../components/chat/SuggestedPrompts'
import ClearConversationButton from '../components/chat/ClearConversationButton'

export default function AIAdvisor() {
  const { messages, isTyping, sendMessage, clearConversation } = useSolarAdvisor()
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  function handlePromptSelect(prompt: string) {
    sendMessage(prompt)
  }

  return (
    <div className="tab-content active" role="tabpanel" aria-label="ai assistant">
      <div className="tab-header-block">
        <h2 className="tab-heading">AI Solar Advisor</h2>
        <p className="tab-subheading">
          Ask questions about solar technology, PM-Surya Ghar subsidies, net metering,
          installation requirements, or maintenance logs.
        </p>
      </div>

      <div className="card-base chat-assistant-card" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
        <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{ width: '20px', height: '20px', stroke: 'var(--accent-blue)', fill: 'none', strokeWidth: '2' }}>
              <use href="#icon-chat" />
            </svg>
            <span className="kpi-title">GET Solar Copilot</span>
          </div>
        </div>

        <MessageList
          messages={messages}
          isTyping={isTyping}
          typingTheme="blue"
          height="280px"
        />

        <SuggestedPrompts
          prompts={SOLAR_ADVISOR_PROMPTS}
          onSelect={handlePromptSelect}
          disabled={isTyping}
        />

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isTyping}
          placeholder="Ask GET Solar Advisor..."
          sendLabel="Send"
        />

        <ClearConversationButton onClear={clearConversation} disabled={isTyping} />
      </div>
    </div>
  )
}
