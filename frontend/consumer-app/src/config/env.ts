export const env = {
  API_URL: import.meta.env.VITE_API_URL || '/api',
  ENABLE_MOCKS: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
} as const
