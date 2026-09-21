import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SupportHelp from '../SupportHelp'
import { ROUTES } from '../../config/routes'
import source from '../SupportHelp.tsx?raw'

const mockPost = vi.fn()
vi.mock('../../services/api/client', () => ({
  default: { post: (...a: any[]) => mockPost(...a) },
}))

vi.mock('../../utils/referral', () => ({
  getUser: () => ({ id: 'u1', email: 'cust@getsolar.in', name: 'Test Customer', referral_code: 'X' }),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.SUPPORT_HELP]}>
      <SupportHelp />
    </MemoryRouter>,
  )
}

function fillValidForm() {
  fireEvent.change(screen.getByPlaceholderText(/Inverter Error Code/i), { target: { value: 'Inverter F24' } })
  fireEvent.change(screen.getByPlaceholderText(/system symptoms/i), { target: { value: 'Inverter shows F24.' } })
}

describe('SupportHelp ticket flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Test 1: support route is registered and renders for the customer', () => {
    expect(ROUTES.SUPPORT_HELP).toBe('/app/support/help')
    renderPage()
    expect(screen.getByText(/Customer Support & Solar Knowledge Base/i)).toBeInTheDocument()
    expect(screen.getByText(/Open Technical Support Ticket/i)).toBeInTheDocument()
  })

  it('Test 3: empty subject/message is not submitted', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Send to Engineering Support/i }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('Test 6: successful backend send shows success with ticket reference', async () => {
    mockPost.mockResolvedValue({ data: { success: true, ticket_id: 'ABC123' } })
    renderPage()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /Send to Engineering Support/i }))
    await waitFor(() => {
      expect(screen.getByText(/Support request sent successfully/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Reference: ABC123/i)).toBeInTheDocument()
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(mockPost.mock.calls[0][0]).toBe('/support/tickets')
  })

  it('Test 7: backend/email failure shows honest error and no success', async () => {
    mockPost.mockRejectedValue({ status: 502, message: 'Unable to send' })
    renderPage()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /Send to Engineering Support/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Unable to send your support request right now/i)
    })
    expect(screen.queryByText(/Support request sent successfully/i)).not.toBeInTheDocument()
    // Form contents are preserved so the customer does not lose their message.
    expect(screen.getByPlaceholderText(/Inverter Error Code/i)).toHaveValue('Inverter F24')
  })

  it('Test 8: duplicate clicks while pending send only one request', async () => {
    let resolvePost: (v: unknown) => void = () => {}
    mockPost.mockReturnValue(new Promise((res) => { resolvePost = res }))
    renderPage()
    fillValidForm()
    const btn = screen.getByRole('button', { name: /Send to Engineering Support/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: /Sending\.\.\./i })).toBeDisabled()
    resolvePost({ data: { success: true, ticket_id: 'D1' } })
    await waitFor(() => {
      expect(screen.getByText(/Support request sent successfully/i)).toBeInTheDocument()
    })
  })

  it('Test 9/10: production submit path uses no mailto and exposes no SMTP secrets', () => {
    expect(source).not.toMatch(/mailto:/i)
    expect(source).not.toMatch(/smtp|app password|getsolarenergy14/i)
    expect(source).toMatch(/api\.post\('\/support\/tickets'/)
  })
})
