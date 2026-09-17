import React, { useMemo } from 'react'
import { MdUpload, MdRoofing, MdCalendarMonth, MdDescription, MdSend, MdBuild, MdVerified, MdOutlineShoppingCart } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes'
import type { CrmCustomer360 } from './crm.types'

interface Props {
  data: CrmCustomer360
  customerId: number
}

interface Action {
  id: string
  label: string
  icon: React.ReactNode
  route?: string
  onClick?: () => void
  priority: 'high' | 'medium' | 'low'
}

export default function CrmSmartActions({ data, customerId }: Props) {
  const navigate = useNavigate()

  const actions = useMemo((): Action[] => {
    const list: Action[] = []
    const hasBill = data.bills.length > 0
    const hasRoof = data.roofAnalysis !== null
    const hasSurvey = data.siteSurvey !== null
    const surveyDone = hasSurvey && (data.siteSurvey?.status === 'Completed' || data.siteSurvey?.status === 'approved')
    const hasProposal = data.proposal !== null
    const isWon = data.customer.status === 'Won'
    const hasInstallation = data.installation !== null
    const installDone = data.installation !== null && (data.installation.completionPercentage ?? 0) >= 100
    const hasAmc = data.amc !== null && data.amc.status === 'Active'

    if (!hasBill) {
      list.push({ id: 'upload-bill', label: 'Upload Bill', icon: <MdUpload size={16} />, route: ROUTES.BILL_ANALYZER, priority: 'high' })
    }
    if (!hasRoof) {
      list.push({ id: 'analyze-roof', label: 'Analyze Roof', icon: <MdRoofing size={16} />, route: ROUTES.ROOF_ANALYSIS, priority: 'high' })
    }
    if (!hasSurvey) {
      list.push({ id: 'schedule-survey', label: 'Schedule Survey', icon: <MdCalendarMonth size={16} />, route: ROUTES.SITE_SURVEY, priority: 'high' })
    }
    if (hasSurvey && !surveyDone) {
      list.push({ id: 'complete-survey', label: 'Complete Survey', icon: <MdVerified size={16} />, route: ROUTES.SITE_SURVEY, priority: 'high' })
    }
    if (surveyDone && !hasProposal) {
      list.push({ id: 'generate-proposal', label: 'Generate Proposal', icon: <MdDescription size={16} />, route: ROUTES.PLANNING_PROPOSAL, priority: 'high' })
    }
    if (hasProposal && !isWon) {
      list.push({ id: 'follow-up', label: 'Follow Up', icon: <MdSend size={16} />, priority: 'medium' })
    }
    if (isWon && !hasInstallation) {
      list.push({ id: 'create-installation', label: 'Start Installation', icon: <MdBuild size={16} />, priority: 'high' })
    }
    if (installDone && !hasAmc) {
      list.push({ id: 'activate-amc', label: 'Activate AMC', icon: <MdOutlineShoppingCart size={16} />, route: ROUTES.AMC, priority: 'medium' })
    }

    return list
  }, [data])

  if (!actions.length) return null

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Smart Actions</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {actions.map(a => (
          <button
            key={a.id}
            className="btn btn-outline"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--font-size-xs)', fontWeight: 500, textAlign: 'left', width: '100%',
              borderColor: a.priority === 'high' ? 'var(--color-amber)' : 'var(--border-subtle)',
            }}
            onClick={() => {
              if (a.route) navigate(a.route)
            }}
          >
            <span style={{ color: a.priority === 'high' ? 'var(--color-amber)' : 'var(--text-muted)' }}>{a.icon}</span>
            {a.label}
            {a.priority === 'high' && (
              <span style={{
                fontSize: 'var(--font-size-2xs)', padding: '1px 4px', borderRadius: 'var(--radius-full)',
                background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)', marginLeft: 'auto',
              }}>Next</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
