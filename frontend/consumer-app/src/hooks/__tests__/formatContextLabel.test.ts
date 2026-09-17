import { describe, it, expect } from 'vitest'
import { formatContextLabel } from '../useSolarAdvisor'

describe('formatContextLabel', () => {
  it('returns "General AI guidance" when context is missing or empty', () => {
    expect(formatContextLabel(undefined)).toBe('General AI guidance')
    expect(formatContextLabel({})).toBe('General AI guidance')
    expect(formatContextLabel({ bill_analysis: {}, roof_analysis: {}, roi_analysis: {} })).toBe('General AI guidance')
  })

  it('returns "Based on your bill analysis" when only bill analysis is present', () => {
    const context = {
      bill_analysis: { monthly_consumption: 400 },
    }
    expect(formatContextLabel(context)).toBe('Based on your bill analysis')
  })

  it('returns "Based on your roof analysis" when only roof analysis is present', () => {
    const context = {
      roof_analysis: { usable_area_sqft: 500 },
    }
    expect(formatContextLabel(context)).toBe('Based on your roof analysis')
  })

  it('returns "Based on your ROI estimate" when only ROI analysis is present', () => {
    const context = {
      roi_analysis: { payback_years: 4.5 },
    }
    expect(formatContextLabel(context)).toBe('Based on your ROI estimate')
  })

  it('returns "Using your bill and roof analysis" when two contexts are present', () => {
    const context = {
      bill_analysis: { monthly_consumption: 400 },
      roof_analysis: { usable_area_sqft: 500 },
    }
    expect(formatContextLabel(context)).toBe('Using your bill and roof analysis')
  })

  it('returns "Using your bill, roof and ROI analysis" when all three contexts are present', () => {
    const context = {
      bill_analysis: { monthly_consumption: 400 },
      roof_analysis: { usable_area_sqft: 500 },
      roi_analysis: { payback_years: 4.5 },
    }
    expect(formatContextLabel(context)).toBe('Using your bill, roof and ROI analysis')
  })
})
