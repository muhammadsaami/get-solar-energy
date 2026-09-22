import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchAllSources,
  lookupCustomerId,
  invalidateCache,
} from '../services/activity.service'

const mockGet = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: { get: (...a: any[]) => mockGet(...a) },
}))

const OWN_EVENTS = [{ id: 1, event_type: 'Proposal Generated' }]
const OTHER_SOURCES_OK = { data: { data: [] } }

function mockSources(opts: {
  customers: Array<{ id: number; email?: string }>
  timeline?: { status: number; body: unknown } | null
}) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/customers') {
      return Promise.resolve({ data: opts.customers })
    }
    if (url.startsWith('/crm/timeline/')) {
      if (!opts.timeline) {
        const err = { response: { status: 404 } }
        return Promise.reject(err)
      }
      if (opts.timeline.status !== 200) {
        return Promise.reject({ response: { status: opts.timeline.status } })
      }
      return Promise.resolve({ data: { data: opts.timeline.body } })
    }
    return Promise.resolve(OTHER_SOURCES_OK)
  })
}

describe('Activity timeline contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    invalidateCache()
  })

  it('resolves the caller own record and requests only that timeline', async () => {
    mockSources({
      customers: [{ id: 7, email: 'owner@getsolar.in' }],
      timeline: { status: 200, body: OWN_EVENTS },
    })
    const sources = await fetchAllSources('owner@getsolar.in')
    expect(sources.timeline).toEqual(OWN_EVENTS)
    expect(sources.errors['timeline']).toBeNull()
    const timelineCalls = mockGet.mock.calls
      .filter(([url]) => String(url).startsWith('/crm/timeline/'))
      .map(([url]) => url)
    expect(timelineCalls).toEqual(['/crm/timeline/7'])
  })

  it('matches the record email case-insensitively', async () => {
    mockSources({ customers: [{ id: 9, email: 'Owner@Getsolar.in' }], timeline: null })
    expect(await lookupCustomerId('owner@getsolar.in')).toBe(9)
  })

  it('no CRM record yields an honest empty timeline without error', async () => {
    mockSources({ customers: [{ id: 7, email: 'someone-else@getsolar.in' }], timeline: null })
    const sources = await fetchAllSources('fresh@getsolar.in')
    expect(sources.timeline).toEqual([])
    expect(sources.errors['timeline']).toBeNull()
    expect(
      mockGet.mock.calls.some(([url]) => String(url).startsWith('/crm/timeline/')),
    ).toBe(false)
  })

  it('cross-user denial surfaces an honest error, never another timeline', async () => {
    mockSources({
      customers: [{ id: 7, email: 'owner@getsolar.in' }],
      timeline: { status: 404, body: null },
    })
    const sources = await fetchAllSources('owner@getsolar.in')
    expect(sources.timeline).toBeNull()
    expect(sources.errors['timeline']).not.toBeNull()
  })

  it('unauthenticated timeline request surfaces an honest error', async () => {
    mockSources({
      customers: [{ id: 7, email: 'owner@getsolar.in' }],
      timeline: { status: 401, body: null },
    })
    const sources = await fetchAllSources('owner@getsolar.in')
    expect(sources.timeline).toBeNull()
    expect(sources.errors['timeline']).not.toBeNull()
  })

  it('never requests a hardcoded customer id', async () => {
    mockSources({
      customers: [{ id: 12, email: 'owner@getsolar.in' }],
      timeline: { status: 200, body: [] },
    })
    await fetchAllSources('owner@getsolar.in')
    const timelineCalls = mockGet.mock.calls
      .filter(([url]) => String(url).startsWith('/crm/timeline/'))
      .map(([url]) => url)
    expect(timelineCalls).toEqual(['/crm/timeline/12'])
  })
})
