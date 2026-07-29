import { useState, useRef, useCallback, useEffect } from 'react'
import { sendSolarAdvisorMessage } from '../services/chat.service'
import type { ChatMessage } from '../types/chat'

const LS_KEY = 'solarChatHistory'
const MAX_HISTORY = 20

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(messages))
  } catch {
    // localStorage write failed silently
  }
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hello! I can help explain your bill analysis, roof assessment, ROI calculations, subsidy eligibility, and solar recommendations. How can I help you today?',
  time: formatTime(),
}

export function useSolarAdvisor() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadHistory()
    if (saved.length === 0) {
      saveHistory([WELCOME_MESSAGE])
      return [WELCOME_MESSAGE]
    }
    return saved
  })
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sendingRef.current) return

    sendingRef.current = true
    setError(null)

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      time: formatTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    try {
      const contextHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await sendSolarAdvisorMessage({
        message: trimmed,
        history: contextHistory,
        context: {},
      })

      setIsTyping(false)

      const reply: ChatMessage = {
        role: 'assistant',
        content: res.response || 'GET Solar Copilot is currently experiencing high demand. Please try again in a few moments.',
        time: formatTime(),
      }

      setMessages((prev) => {
        const updated = [...prev, reply]
        return updated.slice(-MAX_HISTORY)
      })
    } catch (err: unknown) {
      setIsTyping(false)

      let errorMsg = 'Unable to reach AI Assistant. Please try again.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response
        if (response?.status === 429) {
          errorMsg = 'AI Assistant is currently experiencing high demand. Please try again shortly.'
        } else if (response?.status && response.status >= 500) {
          errorMsg = 'AI Assistant is temporarily unavailable. Please try again later.'
        }
      }

      setError(errorMsg)

      const errorReply: ChatMessage = {
        role: 'assistant',
        content: errorMsg,
        time: formatTime(),
      }

      setMessages((prev) => {
        const updated = [...prev, errorReply]
        return updated.slice(-MAX_HISTORY)
      })
    } finally {
      sendingRef.current = false
    }
  }, [messages])

  const clearConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setError(null)
    localStorage.removeItem(LS_KEY)
    saveHistory([WELCOME_MESSAGE])
  }, [])

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearConversation,
  }
}
