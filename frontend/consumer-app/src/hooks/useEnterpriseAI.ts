import { useState, useRef, useCallback, useEffect } from 'react'
import { sendEnterpriseAIMessage } from '../services/chat.service'
import type { ChatMessage, TimelineStep, ToolResult } from '../types/chat'

const LS_HISTORY_KEY = 'enterpriseAIHistory'
const LS_SESSION_KEY = 'enterpriseAISessionId'
const MAX_HISTORY = 30

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY)
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
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(messages))
  } catch {
    // localStorage write failed silently
  }
}

function loadSessionId(): string | null {
  try {
    return localStorage.getItem(LS_SESSION_KEY)
  } catch {
    return null
  }
}

function saveSessionId(id: string) {
  try {
    localStorage.setItem(LS_SESSION_KEY, id)
  } catch {
    // localStorage write failed silently
  }
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Welcome to the Enterprise AI Assistant. I can manage customers, run AI analyses, generate recommendations, create CRM tasks, and more. How can I help?',
  time: formatTime(),
}

export function useEnterpriseAI() {
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
  const [sessionId, setSessionId] = useState<string | null>(loadSessionId)
  const [timeline, setTimeline] = useState<TimelineStep[]>([])
  const [toolResults, setToolResults] = useState<ToolResult[]>([])
  const [contextInfo, setContextInfo] = useState<{ intent: string; confidence: number } | null>(null)
  const sendingRef = useRef(false)
  const abortRef = useRef(false)

  useEffect(() => {
    saveHistory(messages)
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sendingRef.current) return

    sendingRef.current = true
    abortRef.current = false
    setError(null)
    setToolResults([])
    setContextInfo(null)

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      time: formatTime(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    setTimeline([
      { label: 'User Request', status: 'done' },
      { label: 'Classifying Intent', status: 'running' },
      { label: 'Building Plan', status: 'pending' },
      { label: 'Executing Tools', status: 'pending' },
      { label: 'Generating Response', status: 'pending' },
    ])

    setTimeout(() => {
      if (!abortRef.current) {
        setTimeline((prev) =>
          prev.map((step) =>
            step.label === 'Classifying Intent' ? { ...step, status: 'done' as const } : step
          )
        )
      }
    }, 300)

    try {
      setTimeline((prev) =>
        prev.map((step) =>
          step.label === 'Building Plan' ? { ...step, status: 'running' as const } :
          step.label === 'Executing Tools' ? { ...step, status: 'running' as const } :
          step
        )
      )

      const res = await sendEnterpriseAIMessage({
        message: trimmed,
        session_id: sessionId,
        context: {},
      })

      if (abortRef.current) return

      setIsTyping(false)

      if (res.data?.conversation_id) {
        setSessionId(res.data.conversation_id)
        saveSessionId(res.data.conversation_id)
      }

      if (res.data?.context) {
        setContextInfo(res.data.context)
      }

      if (res.data?.tool_results) {
        setToolResults(res.data.tool_results)
      }

      setTimeline([
        { label: 'User Request', status: 'done' },
        { label: 'Classifying Intent', status: 'done' },
        { label: 'Building Plan', status: 'done' },
        { label: 'Executing Tools', status: 'done' },
        { label: 'Generating Response', status: 'done' },
      ])

      const reply: ChatMessage = {
        role: 'assistant',
        content: res.data?.response || 'Request failed. Please try again.',
        time: formatTime(),
      }

      setMessages((prev) => {
        const updated = [...prev, reply]
        return updated.slice(-MAX_HISTORY)
      })
    } catch (err: unknown) {
      if (abortRef.current) return

      setIsTyping(false)

      let errorMsg = 'Unable to reach Enterprise AI. Please try again.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number } }).response
        if (response?.status === 401) {
          errorMsg = 'Your session has expired. Please sign in again.'
        } else if (response?.status === 403) {
          errorMsg = "You don't have permission to use Enterprise AI."
        } else if (response?.status === 429) {
          errorMsg = 'Enterprise AI is currently experiencing high demand. Please try again shortly.'
        } else if (response?.status && response.status >= 500) {
          errorMsg = 'Enterprise AI is temporarily unavailable. Please try again later.'
        }
      }

      setError(errorMsg)
      setTimeline((prev) =>
        prev.map((step) =>
          step.status === 'running' ? { ...step, status: 'error' as const } : step
        )
      )

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
  }, [messages, sessionId])

  const clearConversation = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setError(null)
    setTimeline([])
    setToolResults([])
    setContextInfo(null)
    localStorage.removeItem(LS_HISTORY_KEY)
    localStorage.removeItem(LS_SESSION_KEY)
    setSessionId(null)
    saveHistory([WELCOME_MESSAGE])
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current = true
    }
  }, [])

  return {
    messages,
    isTyping,
    error,
    timeline,
    toolResults,
    contextInfo,
    sendMessage,
    clearConversation,
  }
}
