import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { knowledgeBaseService } from './knowledgeBase.service'
import { useKnowledgeBase } from '../hooks/useKnowledgeBase'

const mockGet = vi.fn()
vi.mock('../../../services/api/client', () => ({
  default: { get: (...a) => mockGet(...a) },
}))

vi.mock('../../../stores/notificationStore', () => ({
  useNotificationStore: (sel) => sel({ addToast: vi.fn() }),
}))

describe('Knowledge Base backend-failure honesty', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('backend failure throws instead of serving fabricated production documents', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'))
    await expect(knowledgeBaseService.getDashboard()).rejects.toThrow(/Failed to load the knowledge base/i)
  })

  it('backend failure never leaks mock document identities', async () => {
    mockGet.mockRejectedValue({ response: { status: 500 } })
    let outcome = null
    try {
      outcome = await knowledgeBaseService.getDashboard()
    } catch {
      outcome = null
    }
    const text = JSON.stringify(outcome)
    expect(text).not.toMatch(/doc-001/)
    expect(text).not.toMatch(/Rajesh Kumar/)
  })

  it('unauthorized backend response resolves to an honest empty state', async () => {
    mockGet.mockRejectedValue({ response: { status: 401 } })
    const dashboard = await knowledgeBaseService.getDashboard()
    expect(dashboard.unauthorized).toBe(true)
    expect(dashboard.allDocuments).toEqual([])
  })

  it('empty backend library resolves to an honest empty state', async () => {
    mockGet.mockResolvedValue({ data: { success: true, articles: [] } })
    const dashboard = await knowledgeBaseService.getDashboard()
    expect(dashboard.allDocuments).toEqual([])
    expect(dashboard.score).toBe(0)
  })

  it('hook surfaces the error with retry instead of mock documents', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useKnowledgeBase())
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.error).toMatch(/Failed to load the knowledge base/i)
    expect(result.current.dashboard).toBeNull()
    expect(typeof result.current.retry).toBe('function')
  })
})
