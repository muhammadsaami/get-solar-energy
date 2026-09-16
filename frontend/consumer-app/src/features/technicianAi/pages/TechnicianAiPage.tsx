import React from 'react'
import { useTechnicianAi } from '../hooks/useTechnicianAi'
import TechnicianAiHero from '../components/TechnicianAiHero'
import SuggestedPrompts from '../components/SuggestedPrompts'
import ConversationPanel from '../components/ConversationPanel'
import MessageComposer from '../components/MessageComposer'
import DiagnosticCard from '../components/DiagnosticCard'
import EscalationPanel from '../components/EscalationPanel'
import TroubleshootingDrawer from '../components/TroubleshootingDrawer'
import TroubleshootingDrawerContent from '../components/TroubleshootingDrawerContent'
import '../styles/technician-ai.css'

export default function TechnicianAiPage() {
  const {
    messages,
    inputQuery,
    setInputQuery,
    sending,
    selectedDiagnosis,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleSendMessage,
    handleClearHistory,
  } = useTechnicianAi()

  return (
    <div className="technician-ai-container">
      <TechnicianAiHero onClearHistory={handleClearHistory} />

      <div className="ai-workspace-grid">
        {/* Main Conversation Workspace */}
        <div className="ai-chat-panel">
          <ConversationPanel
            messages={messages}
            sending={sending}
            onSelectDiagnosis={openDrawer}
          />

          <MessageComposer
            query={inputQuery}
            onQueryChange={setInputQuery}
            onSend={handleSendMessage}
            sending={sending}
          />
        </div>

        {/* Right Diagnostic & Escalation Sidebar */}
        <div className="ai-sidebar">
          {selectedDiagnosis ? (
            <DiagnosticCard
              diagnosis={selectedDiagnosis}
              onOpenDrawer={openDrawer}
            />
          ) : (
            <SuggestedPrompts onSelectPrompt={handleSendMessage} />
          )}

          <EscalationPanel />
        </div>
      </div>

      {/* Reusable Troubleshooting Slide-over Drawer */}
      <TroubleshootingDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedDiagnosis ? `Action Plan: ${selectedDiagnosis.title}` : 'Field Action Plan'}
      >
        {selectedDiagnosis && <TroubleshootingDrawerContent diagnosis={selectedDiagnosis} />}
      </TroubleshootingDrawer>
    </div>
  )
}
