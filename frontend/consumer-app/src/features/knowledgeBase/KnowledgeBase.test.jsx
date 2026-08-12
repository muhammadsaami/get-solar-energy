import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { knowledgeBaseService } from './services/knowledgeBase.service'
import { useNotificationStore } from '../../stores/notificationStore'

vi.mock('./services/knowledgeBase.api', () => ({
  knowledgeBaseApi: {
    getDashboard: vi.fn(),
    getDocument: vi.fn(),
    getRelatedDocuments: vi.fn(),
    toggleBookmark: vi.fn(),
    downloadDocument: vi.fn(),
    shareDocument: vi.fn(),
  },
}))

import { knowledgeBaseApi } from './services/knowledgeBase.api'
import KnowledgeBase from './KnowledgeBase'
import ToastHost from '../../components/auth/ToastHost'

function resolveWith(data) {
  return Promise.resolve(data)
}

function renderPage() {
  return render(
    <>
      <KnowledgeBase />
      <ToastHost />
    </>
  )
}

describe('KnowledgeBase page (runtime smoke)', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] })
    const docs = knowledgeBaseService.getDocuments()
    const mockDashboard = {
      allDocuments: docs,
      featuredDocuments: docs.filter((d) => d.featured),
      bookmarkedDocuments: docs.filter((d) => d.bookmarked),
      recentlyViewedDocuments: docs.filter((d) => d.recentlyViewed).slice(0, 5),
      popularDocuments: docs.slice(0, 6),
      latestDocuments: docs.slice(0, 6),
      categories: [...new Set(docs.map((d) => d.category))],
      score: 85,
    }
    knowledgeBaseApi.getDashboard.mockImplementation(() => resolveWith(mockDashboard))
    knowledgeBaseApi.getDocument.mockImplementation((id) => resolveWith(knowledgeBaseService.getDocument(id)))
    knowledgeBaseApi.getRelatedDocuments.mockImplementation((id) => resolveWith(knowledgeBaseService.getRelatedDocuments(id)))
    knowledgeBaseApi.toggleBookmark.mockImplementation((id) => resolveWith(knowledgeBaseService.toggleBookmark(id)))
    knowledgeBaseApi.downloadDocument.mockImplementation((id) => resolveWith(knowledgeBaseService.downloadDocument(id)))
    knowledgeBaseApi.shareDocument.mockImplementation((id) => resolveWith(knowledgeBaseService.shareDocument(id)))
  })

  it('renders the page shell and document library after load', async () => {
    renderPage()

    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Knowledge Base' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search knowledge base')).toBeInTheDocument()
    expect(screen.getByLabelText('Sort documents')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Library')).toBeInTheDocument()
    })

    const openButtons = screen.getAllByRole('button', { name: /Open / })
    expect(openButtons.length).toBeGreaterThan(0)
  })

  it('filters documents by category', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Library'))

    await userEvent.selectOptions(screen.getByLabelText('Filter by category'), 'Safety')
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
    const openButtons = screen.getAllByRole('button', { name: /Open / })
    expect(openButtons.length).toBeGreaterThan(0)
    expect(openButtons.length).toBeLessThanOrEqual(5)
  })

  it('searches documents by free text', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Library'))

    await userEvent.type(screen.getByLabelText('Search knowledge base'), 'battery')
    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
    const openButtons = screen.getAllByRole('button', { name: /Open / })
    expect(openButtons.every((b) => b.getAttribute('aria-label').includes('Battery Energy Storage'))).toBe(true)
  })

  it('shows empty state when nothing matches', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Library'))

    await userEvent.type(screen.getByLabelText('Search knowledge base'), 'zzzzzzzz')
    await waitFor(() => {
      expect(screen.getByText('No matching documents')).toBeInTheDocument()
    })
  })

  it('opens the document drawer and shows related documents', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Library'))

    const firstOpen = screen.getAllByRole('button', { name: /Open / })[0]
    await userEvent.click(firstOpen)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => {
      expect(screen.getByText('About this document')).toBeInTheDocument()
    })
    const closeBtn = screen.getByRole('button', { name: 'Close drawer' })
    await userEvent.click(closeBtn)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('shows a success toast when bookmarking a document', async () => {
    renderPage()
    await waitFor(() => screen.getByText('Library'))

    const bookmarkBtns = await screen.findAllByRole('button', { name: 'Bookmark document' })
    await userEvent.click(bookmarkBtns[0])
    await waitFor(() => {
      const toasts = useNotificationStore.getState().toasts
      expect(toasts.some((t) => t.message === 'Bookmarked')).toBe(true)
    })
  })
})



