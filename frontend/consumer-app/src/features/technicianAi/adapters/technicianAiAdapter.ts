import type {
  ChatMessage,
  RawDiagnosisPayload,
  AdaptedDiagnosticData,
} from '../types/technicianAi.types'

export function adaptDiagnosticSession(
  messages: ChatMessage[],
  latestDiagnosis?: RawDiagnosisPayload
): AdaptedDiagnosticData {
  const formattedMessages = messages.map(m => ({
    ...m,
    formattedTime: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))

  return {
    messages: formattedMessages,
    lastDiagnosis: latestDiagnosis,
  }
}
