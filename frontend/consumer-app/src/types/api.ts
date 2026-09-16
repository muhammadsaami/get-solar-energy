export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors?: string[]
  timestamp?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total_count: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}

export interface ApiError {
  status: number
  message: string
  raw?: unknown
}
