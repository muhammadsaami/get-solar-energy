import { describe, it, expect } from 'vitest'
import { calculateEstimate, calculateFallbackROI } from '../solar'
import { computeProposalInsights } from '../proposalInsights'
import supportHelpSource from '../../pages/SupportHelp.tsx?raw'
import aiAdvisorSource from '../../pages/AIAdvisor.tsx?raw'
import solarAdvisorHookSource from '../../hooks/useSolarAdvisor.ts?raw'
import solarAdvisorPromptsSource from '../../config/solarAdvisorPrompts.ts?raw'
import signupSource from '../../pages/Signup.tsx?raw'

describe('No-subsidy product regression', () => {
  it('estimate math uses full system cost with no subsidy deduction', () => {
    const est = calculateEstimate('Lucknow', 6500)
    expect('subsidy' in est).toBe(false)
    expect(est.netCost).toBe(est.systemCost)
    const roi = calculateFallbackROI({ monthlyBill: 6500, systemSize: 3 })
    expect('governmentSubsidy' in roi).toBe(false)
    expect(roi.netCost).toBe(roi.systemCost)
  })

  it('proposal insights carry no subsidy values', () => {
    const insights = computeProposalInsights({
      recommendedKw: '3',
      electricityRate: '8.0',
      roofArea: '400',
      monthlyBill: '3200',
    })
    expect('subsidy' in insights).toBe(false)
    expect(insights.netCost).toBe(insights.systemCost)
  })

  it('support surface contains no subsidy claims', () => {
    expect(supportHelpSource).not.toMatch(/subsid/i)
    expect(supportHelpSource).not.toMatch(/surya/i)
  })

  it('advisor surfaces contain no subsidy capability claims', () => {
    for (const source of [aiAdvisorSource, solarAdvisorHookSource, solarAdvisorPromptsSource, signupSource]) {
      expect(source).not.toMatch(/subsid/i)
      expect(source).not.toMatch(/surya/i)
    }
  })
})
