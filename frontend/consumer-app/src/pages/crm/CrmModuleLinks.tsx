import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOpenInNew, MdReceipt, MdRoofing, MdCalendarMonth, MdDescription, MdBuild, MdVerified, MdCardGiftcard, MdCalculate } from 'react-icons/md'
import { ROUTES } from '../../config/routes'
import type { CrmCustomer360 } from './crm.types'

interface Props {
  data: CrmCustomer360
}

interface ModuleLink {
  label: string
  icon: React.ReactNode
  route: string
  enabled: boolean
}

export default function CrmModuleLinks({ data }: Props) {
  const navigate = useNavigate()
  const hasBill = data.bills.length > 0
  const hasRoof = data.roofAnalysis !== null
  const hasSurvey = data.siteSurvey !== null
  const hasProposal = data.proposal !== null

  const links: ModuleLink[] = [
    { label: 'Bill Analyzer', icon: <MdReceipt size={16} />, route: ROUTES.BILL_ANALYZER, enabled: hasBill },
    { label: 'Roof Analysis', icon: <MdRoofing size={16} />, route: ROUTES.ROOF_ANALYSIS, enabled: hasRoof },
    { label: 'Site Survey', icon: <MdCalendarMonth size={16} />, route: ROUTES.SITE_SURVEY, enabled: hasSurvey },
    { label: 'Proposal', icon: <MdDescription size={16} />, route: ROUTES.PLANNING_PROPOSAL, enabled: hasProposal },
    { label: 'ROI Calculator', icon: <MdCalculate size={16} />, route: ROUTES.ROI_CALCULATOR, enabled: hasBill },
    { label: 'Installation', icon: <MdBuild size={16} />, route: ROUTES.INSTALLATION_PROGRESS, enabled: data.installation !== null },
    { label: 'AMC', icon: <MdVerified size={16} />, route: ROUTES.AMC, enabled: data.amc !== null },
    { label: 'Rewards', icon: <MdCardGiftcard size={16} />, route: ROUTES.REWARDS, enabled: true },
  ]

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Quick Navigation</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {links.map(l => (
          <button
            key={l.label}
            className="btn btn-ghost"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--font-size-xs)', fontWeight: 500, textAlign: 'left', width: '100%',
              opacity: l.enabled ? 1 : 0.4, cursor: l.enabled ? 'pointer' : 'default',
              justifyContent: 'space-between',
            }}
            onClick={() => l.enabled && navigate(l.route)}
            disabled={!l.enabled}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{l.icon}</span>
              {l.label}
            </span>
            {l.enabled && <MdOpenInNew size={12} style={{ color: 'var(--text-muted)' }} />}
          </button>
        ))}
      </div>
    </div>
  )
}
