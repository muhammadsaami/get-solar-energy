export interface RawDiagnosisPayload {
  error_code: string
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  cause: string
  steps: string[]
  safety_warning?: string
  suggested_kb_title?: string
  recommended_training_module?: string
}

export interface RawTroubleshootResponse {
  success: boolean
  diagnosis: RawDiagnosisPayload
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
  diagnosis?: RawDiagnosisPayload
}

export interface SuggestedPrompt {
  id: string
  title: string
  errorCode?: string
  prompt: string
  category: 'Inverter' | 'String Wiring' | 'DISCOM Grid' | 'Grounding'
}

export interface AdaptedDiagnosticData {
  messages: ChatMessage[]
  lastDiagnosis?: RawDiagnosisPayload
}
