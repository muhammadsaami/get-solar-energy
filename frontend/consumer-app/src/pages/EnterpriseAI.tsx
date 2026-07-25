import React, { useState } from 'react'
import { useEnterpriseAI } from '../hooks/useEnterpriseAI'
import { ENTERPRISE_AI_PROMPTS } from '../config/enterpriseAIPrompts'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import SuggestedPrompts from '../components/chat/SuggestedPrompts'
import ClearConversationButton from '../components/chat/ClearConversationButton'
import EnterpriseSidebar from '../components/chat/EnterpriseSidebar'

export default function EnterpriseAI() {
  const {
    messages,
    isTyping,
    timeline,
    toolResults,
    contextInfo,
    sendMessage,
    clearConversation,
  } = useEnterpriseAI()
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
    <div className="tab-content active" role="tabpanel" aria-label="enterprise ai">
      <div className="tab-header-block">
        <h2 className="tab-heading">Enterprise AI Assistant</h2>
        <p className="tab-subheading">
          Intelligent orchestration layer — CRM, Customer360, AI Analysis,
          Recommendations, and more.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
        <div className="card-base" style={{ '--card-theme': '124, 93, 250' } as React.CSSProperties}>
          <div className="kpi-header-row" style={{ borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ width: '20px', height: '20px', stroke: '#7c5dfa', fill: 'none', strokeWidth: '2' }}>
                <use href="#icon-bot" />
              </svg>
              <span className="kpi-title">Enterprise AI Copilot</span>
            </div>
          </div>

          <MessageList
            messages={messages}
            isTyping={isTyping}
            typingTheme="purple"
            height="340px"
          />

          <SuggestedPrompts
              prompts={ENTERPRISE_AI_PROMPTS}
              onSelect={handlePromptSelect}
              disabled={isTyping}
              theme="purple"
            />

            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isTyping}
              placeholder="Ask Enterprise AI..."
              sendLabel="Send"
              theme="purple"
            />

          <ClearConversationButton onClear={clearConversation} disabled={isTyping} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <EnterpriseSidebar
            toolResults={toolResults}
            timeline={timeline}
            context={contextInfo}
          />
        </div>
      </div>
    </div>
  )
}
