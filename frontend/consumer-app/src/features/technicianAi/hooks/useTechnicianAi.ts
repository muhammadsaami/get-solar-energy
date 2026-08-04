import { useState, useCallback } from 'react'
import { technicianAiApi } from '../services/technicianAi.api'
import type { ChatMessage, RawDiagnosisPayload } from '../types/technicianAi.types'
import { useNotificationStore } from '../../../stores/notificationStore'

export function useTechnicianAi() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: 'Hello Engineer! I am your GET Solar AI Field Assistant. How can I assist with your rooftop solar installation, inverter fault code, or DISCOM grid interconnection today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [inputQuery, setInputQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<RawDiagnosisPayload | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const addToast = useNotificationStore(s => s.addToast)

  const openDrawer = useCallback((diagnosis: RawDiagnosisPayload) => {
    setSelectedDiagnosis(diagnosis)
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
    setSelectedDiagnosis(null)
  }, [])

  const handleSendMessage = useCallback(
    async (text: string, errorCode?: string) => {
      const q = text.trim()
      if (!q) return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(prev => [...prev, userMsg])
      setInputQuery('')
      setSending(true)

      try {
        const diag = await technicianAiApi.troubleshoot(q, errorCode)

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Diagnostic Result for '${diag.error_code}': ${diag.title}. ${diag.cause}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          diagnosis: diag,
        }

        setMessages(prev => [...prev, aiMsg])
        setSelectedDiagnosis(diag)
      } catch {
        addToast({ type: 'error', message: 'Failed to communicate with GET Solar AI Troubleshooting assistant.' })
      } finally {
        setSending(false)
      }
    },
    [addToast]
  )

  const handleClearHistory = useCallback(() => {
    setMessages([
      {
        id: 'msg-init',
        sender: 'ai',
        text: 'Session reset. Ready for new field diagnostic queries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setSelectedDiagnosis(null)
  }, [])

  return {
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
  }
}
