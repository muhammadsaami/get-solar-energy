import { useState, useRef, useCallback, useEffect } from 'react'
import { sendSolarAdvisorMessage } from '../services/chat.service'
import { usePlanning } from '../contexts/PlanningContext'
import type { ChatMessage, GroundingSource } from '../types/chat'

const LS_KEY = 'solarChatHistory'
const MAX_HISTORY = 20

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

function getActiveContext(planning: ReturnType<typeof usePlanning>) {
  const context: {
    bill_analysis?: Record<string, unknown>
    roof_analysis?: Record<string, unknown>
    roi_analysis?: Record<string, unknown>
  } = {}

  // Bill analysis
  const bill = planning?.activeBillOcr || (planning?.bills && planning.bills.length > 0 ? planning.bills[0] : null) || (() => {
    try {
      const raw = localStorage.getItem('solar_bill_analysis')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()
  if (bill && typeof bill === 'object' && Object.keys(bill).length > 0) {
    context.bill_analysis = bill
  }

  // Roof analysis
  const roof = planning?.roofAnalysis || (() => {
    try {
      const raw = localStorage.getItem('solar_roof_analysis')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()
  if (roof && typeof roof === 'object' && Object.keys(roof).length > 0) {
    context.roof_analysis = roof
  }

  // ROI analysis
  const roi = (() => {
    try {
      const raw = localStorage.getItem('roiAnalysisState')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.result && Object.keys(parsed.result).length > 0) return parsed.result
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0 && !parsed.result) return parsed
      }
    } catch {
      // fallback
    }
    if (planning?.proposal && typeof planning.proposal === 'object' && Object.keys(planning.proposal).length > 0) {
      return planning.proposal
    }
    return null
  })()
  if (roi && typeof roi === 'object' && Object.keys(roi).length > 0) {
    context.roi_analysis = roi
  }

  return context
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
      const contextHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await sendSolarAdvisorMessage({
        message: trimmed,
        history: contextHistory,
        context: activeContext,
      })

      setIsTyping(false)

      if (res && res.success && res.response) {
        const reply: ChatMessage = {
          role: 'assistant',
          content: res.response,
          time: formatTime(),
          contextUsed: contextLabel,
          sources: res.sources as GroundingSource[] | undefined,
        }

        setMessages((prev) => {
          const updated = [...prev, reply]
          return updated.slice(-MAX_HISTORY)
        })
      } else {
        const errorDetail = res?.message || res?.error || 'Solar AI service was unable to generate a response. Please try again.'
        setError(errorDetail)

        const errorReply: ChatMessage = {
          role: 'assistant',
          content: errorDetail,
          time: formatTime(),
          contextUsed: contextLabel,
          isError: true,
        }

        setMessages((prev) => {
          const updated = [...prev, errorReply]
          return updated.slice(-MAX_HISTORY)
        })
      }
    } catch (err: unknown) {
      setIsTyping(false)

      let errorMsg = 'Unable to reach the Solar AI service. Please check your connection.'
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { detail?: string; error?: string; message?: string } } }).response
        const status = response?.status
        const detail = response?.data?.detail || response?.data?.message || response?.data?.error

        if (status === 401 || status === 403) {
          errorMsg = 'Your session has expired. Please sign in again.'
        } else if (status === 429) {
          errorMsg = 'Solar AI is currently experiencing high demand. Please try again shortly.'
        } else if (status === 408 || status === 504) {
          errorMsg = 'Solar AI request timed out. Please try again.'
        } else if (status && status >= 500) {
          errorMsg = detail || 'Solar AI is temporarily unavailable. Please try again later.'
        } else if (detail) {
          errorMsg = detail
        }
      }

      setError(errorMsg)

      const errorReply: ChatMessage = {
        role: 'assistant',
        content: errorMsg,
        time: formatTime(),
        contextUsed: contextLabel,
        isError: true,
      }

      setMessages((prev) => {
        const updated = [...prev, errorReply]
        return updated.slice(-MAX_HISTORY)
      })
    } finally {
      sendingRef.current = false
    }
  }, [messages, planning])

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
