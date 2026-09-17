import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth — matches the real backend contract (auth.py /api/login).
  http.post('/api/login', () => {
    return HttpResponse.json({
      success: true,
      message: 'Login successful!',
      token: 'mock_access_token',
      user: {
        id: 1,
        email: 'test@getsolar.in',
        name: 'TEST',
        role: 'customer',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GETSolar',
      },
    })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ success: true, message: 'OK' })
  }),

  // Catch-all for unhandled routes
  http.all('*', () => {
    return new HttpResponse(null, { status: 404 })
  }),
]
