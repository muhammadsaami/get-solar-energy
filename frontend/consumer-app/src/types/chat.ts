export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
  showActionCard?: 'bill' | 'roof' | 'roi'
}

export interface SolarAdvisorRequest {
  message: string
  history: { role: string; content: string }[]
  context: {
    bill_analysis?: Record<string, unknown>
    roof_analysis?: Record<string, unknown>
    roi_analysis?: Record<string, unknown>
  }
}

export interface SolarAdvisorResponse {
  success: boolean
  response: string
}

export interface EnterpriseAIRequest {
  message: string
  session_id: string | null
  context: {
    bill?: unknown
    roof?: unknown
    roi?: unknown
  }
}

export interface EnterpriseAIResponse {
  success: boolean
  data: {
    response: string
    tool_results?: ToolResult[]
    context?: { intent: string; confidence: number }
    conversation_id?: string
  }
}

export interface ToolResult {
  tool: string
  success: boolean
  latency_ms: number
}

export interface TimelineStep {
  label: string
  status: 'done' | 'running' | 'pending' | 'error'
}
