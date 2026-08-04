import { useState, useCallback, useEffect } from 'react'
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

  useEffect(() => {
    let isMounted = true
    technicianAiApi
      .getHistory()
      .then(history => {
        if (isMounted && history && history.length > 0) {
          const historyMsgs: ChatMessage[] = []
          const reversed = history.slice().reverse()
          for (const item of reversed) {
            if (item.user_message) {
              historyMsgs.push({
                id: `user-hist-${item.id}`,
                sender: 'user',
                text: item.user_message,
                timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              })
            }
            if (item.ai_response) {
              historyMsgs.push({
                id: `ai-hist-${item.id}`,
                sender: 'ai',
                text: item.ai_response,
                timestamp: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              })
            }
          }
          setMessages(prev => [prev[0], ...historyMsgs])
        }
      })
      .catch(() => {
        // Ignore history errors
      })

    return () => {
      isMounted = false
    }
  }, [])

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
