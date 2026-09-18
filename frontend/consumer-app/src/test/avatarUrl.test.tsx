import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from './test-utils'
import { resolveAvatarUrl } from '../utils/avatar'
import UserMenu from '../components/layout/UserMenu'

let mockUser: Record<string, unknown> | null = null

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}))

describe('resolveAvatarUrl', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns null for null, undefined, empty, or whitespace', () => {
    expect(resolveAvatarUrl(null)).toBeNull()
    expect(resolveAvatarUrl(undefined)).toBeNull()
    expect(resolveAvatarUrl('')).toBeNull()
    expect(resolveAvatarUrl('   ')).toBeNull()
    expect(resolveAvatarUrl('null')).toBeNull()
    expect(resolveAvatarUrl('undefined')).toBeNull()
  })

  it('rejects filesystem paths and Windows drive paths', () => {
    expect(resolveAvatarUrl('C:\\Users\\admin\\photo.jpg')).toBeNull()
    expect(resolveAvatarUrl('D:\\images\\avatar.png')).toBeNull()
    expect(resolveAvatarUrl('\\\\network-share\\folder\\avatar.png')).toBeNull()
    expect(resolveAvatarUrl('/Users/admin/photo.jpg')).toBeNull()
    expect(resolveAvatarUrl('/home/user/photo.jpg')).toBeNull()
  })

  it('preserves absolute URLs untouched without double-prefixing', () => {
    const httpsUrl = 'https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg'
    expect(resolveAvatarUrl(httpsUrl)).toBe(httpsUrl)

    const httpUrl = 'http://example.com/images/avatar.jpg'
    expect(resolveAvatarUrl(httpUrl)).toBe(httpUrl)

    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
    expect(resolveAvatarUrl(dataUrl)).toBe(dataUrl)

    const blobUrl = 'blob:http://localhost:5173/550e8400-e29b-41d4-a716-446655440000'
    expect(resolveAvatarUrl(blobUrl)).toBe(blobUrl)
  })

  it('normalizes relative /uploads/ and uploads/ paths correctly', () => {
    const res1 = resolveAvatarUrl('/uploads/abc123.jpg')
    const res2 = resolveAvatarUrl('uploads/abc123.jpg')
    expect(res1).toMatch(/(\/uploads\/abc123\.jpg)$/)
    expect(res2).toMatch(/(\/uploads\/abc123\.jpg)$/)
  })

  it('never produces double-prefixed or malformed URLs', () => {
    const res = resolveAvatarUrl('/uploads/test.png')
    expect(res).not.toContain('http://localhost:5173/http://')
    expect(res).not.toContain('http://127.0.0.1:8000/http://')
    expect(res).not.toContain('http://localhost:8000/http://')
    expect(res).toMatch(/(\/uploads\/test\.png)$/)
  })
})

describe('UserMenu Avatar Rendering & Broken Image Fallback', () => {
  beforeEach(() => {
    mockUser = null
    vi.clearAllMocks()
  })

  it('renders initials when user has no avatar', () => {
    mockUser = { name: 'Aarav Sharma', role: 'customer' }
    renderWithProviders(<UserMenu />)
    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.queryByAltText('Aarav Sharma')).not.toBeInTheDocument()
  })

  it('renders img tag when valid avatar is present', () => {
    mockUser = { name: 'Aarav Sharma', role: 'customer', avatar: '/uploads/valid-avatar.jpg' }
    renderWithProviders(<UserMenu />)
    const img = screen.getByAltText('Aarav Sharma')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toMatch(/(\/uploads\/valid-avatar\.jpg)$/)
  })

  it('falls back to initials when avatar img triggers onError', () => {
    mockUser = { name: 'Aarav Sharma', role: 'customer', avatar: '/uploads/broken-avatar.jpg' }
    renderWithProviders(<UserMenu />)
    const img = screen.getByAltText('Aarav Sharma')
    expect(img).toBeInTheDocument()

    // Trigger image load error
    fireEvent.error(img)

    // Image must be hidden and initials displayed
    expect(screen.queryByAltText('Aarav Sharma')).not.toBeInTheDocument()
    expect(screen.getByText('AS')).toBeInTheDocument()
  })
})
