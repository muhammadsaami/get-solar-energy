import { useState, useRef, useCallback, useEffect } from 'react'
import { sendSolarAdvisorMessage } from '../services/chat.service'
import { usePlanning } from '../contexts/PlanningContext'
import type { ChatMessage } from '../types/chat'
import { readUserStorage, getUserStorageKey, type IdentifiableUser } from '../utils/userStorage'
import { tokenManager } from '../services/auth/tokenManager'

const MAX_HISTORY = 20

const NO_REPLY_FALLBACK =
  'Please upload your electricity bill in the Bill Analyzer first, then I can analyze it. You can also ask me general solar questions.'

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatContextLabel(context?: {
  bill_analysis?: Record<string, unknown>
  roof_analysis?: Record<string, unknown>
  roi_analysis?: Record<string, unknown>
}): string {
  if (!context) return 'General AI guidance'

  const hasBill = Boolean(context.bill_analysis && Object.keys(context.bill_analysis).length > 0)
  const hasRoof = Boolean(context.roof_analysis && Object.keys(context.roof_analysis).length > 0)
  const hasRoi = Boolean(context.roi_analysis && Object.keys(context.roi_analysis).length > 0)

  const active: string[] = []
  if (hasBill) active.push('bill')
  if (hasRoof) active.push('roof')
  if (hasRoi) active.push('ROI')

  if (active.length === 3) {
    return 'Using your bill, roof and ROI analysis'
  }
  if (active.length === 2) {
    return `Using your ${active[0]} and ${active[1]} analysis`
  }
  if (hasBill) {
    return 'Based on your bill analysis'
  }
  if (hasRoof) {
    return 'Based on your roof analysis'
  }
  if (hasRoi) {
    return 'Based on your ROI estimate'
  }

  return 'General AI guidance'
}

function getActiveContext(_planning: ReturnType<typeof usePlanning>) {
  const user = tokenManager.getUser() as IdentifiableUser | null
  const context: {
    bill_analysis?: Record<string, unknown>
    roof_analysis?: Record<string, unknown>
    roi_analysis?: Record<string, unknown>
  } = {}

  if (!user || (!user.id && !user.email)) {
    return context
  }

  // Strictly user-scoped analyses: fresh user receives empty context
  const bill = readUserStorage<Record<string, unknown>>('lastBillAnalysis', user)
  if (bill && typeof bill === 'object' && Object.keys(bill).length > 0) {
    context.bill_analysis = bill
  }

  const roof = readUserStorage<Record<string, unknown>>('lastRoofAnalysis', user)
  if (roof && typeof roof === 'object' && Object.keys(roof).length > 0) {
    context.roof_analysis = roof
  }

  const roiState = readUserStorage<{ result?: Record<string, unknown> }>('roiAnalysisState', user)
  if (roiState?.result && Object.keys(roiState.result).length > 0) {
    context.roi_analysis = roiState.result
  }

  return context
}

function getChatStorageKey(): string {
  const user = tokenManager.getUser() as IdentifiableUser | null
  return getUserStorageKey('solarChatHistory', user)
}

function loadHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getChatStorageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Drop any previously saved messages that have no text (they crash/blank the UI)
    return parsed.filter(
      (m) => m && typeof m.content === 'string' && m.content.trim() !== ''
    )
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(getChatStorageKey(), JSON.stringify(messages))
  } catch {
    // localStorage write failed silently
  }
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'Hello! I can help explain your bill analysis, roof assessment, ROI calculations, subsidy eligibility, and solar recommendations. How can I help you today?',
  time: formatTime(),
  contextUsed: 'General AI guidance',
}

export function useSolarAdvisor() {
  const planning = usePlanning()
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

    const activeContext = getActiveContext(planning)
    const contextLabel = formatContextLabel(activeContext)

    try {
      // Never send empty messages to the backend
      const contextHistory = messages
        .filter((m) => m.content && m.content.trim() !== '')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const response = await sendSolarAdvisorMessage({
        message: trimmed,
        context: activeContext,
        history: contextHistory,
      })

      // If the backend sends no reply text, show a helpful fallback instead of an empty bubble
      const replyText =
        typeof response?.response === 'string' && response.response.trim() !== ''
          ? response.response
          : NO_REPLY_FALLBACK

      const botMessage: ChatMessage = {
        role: 'assistant',
        content: replyText,
        time: formatTime(),
        contextUsed: contextLabel,
        sources: response?.sources ?? [],
      }

      setMessages((prev) => {
        const next = [...prev, botMessage]
        return next.length > MAX_HISTORY
          ? [next[0], ...next.slice(next.length - (MAX_HISTORY - 1))]
          : next
      })
    } catch (err: unknown) {
      const errAny = err as { response?: { data?: { detail?: string; error?: string; message?: string } } }
      const detailMsg =
        errAny?.response?.data?.detail ||
        errAny?.response?.data?.error ||
        errAny?.response?.data?.message
      setError(detailMsg || 'Could not connect to the Solar Assistant. Please try again.')
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content:
          detailMsg ||
          'I am having trouble connecting to the advisory service right now. Please try again in a moment.',
        time: formatTime(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
      sendingRef.current = false
    }
  }, [messages, planning])

  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(getChatStorageKey())
      localStorage.removeItem('solarChatHistory')
    } catch {
      // ignore
    }
    const fresh: ChatMessage = { ...WELCOME_MESSAGE, time: formatTime() }
    setMessages([fresh])
    saveHistory([fresh])
    setError(null)
  }, [])

  return {
    messages,
    isTyping,
    error,
    sendMessage,
    clearHistory,
  }
}