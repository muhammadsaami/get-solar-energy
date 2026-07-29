import React, { useMemo } from 'react'
import { MdCheckCircle, MdRadioButtonUnchecked, MdSchedule } from 'react-icons/md'
import type { CrmCustomer360, CrmBillSummary, CrmSurveyInfo, CrmProposalInfo, CrmInstallationInfo, CrmAmcInfo } from './crm.types'

interface Props {
  data: CrmCustomer360
}

interface JourneyStage {
  id: string
  label: string
  status: 'completed' | 'active' | 'upcoming'
  completedDate?: string
  owner: string
  nextAction?: string
}

const STAGE_DEFS: { id: string; label: string; check: (data: CrmCustomer360) => boolean; owner: string; nextAction?: string }[] = [
  { id: 'lead', label: 'Lead Created', check: () => true, owner: 'System' },
  { id: 'bill', label: 'Bill Uploaded', check: (d) => d.bills.length > 0, owner: 'Customer', nextAction: 'Upload Bill' },
  { id: 'roof', label: 'Roof Analysis', check: (d) => d.roofAnalysis !== null, owner: 'System', nextAction: 'Analyze Roof' },
  { id: 'survey', label: 'Survey Scheduled', check: (d) => d.siteSurvey !== null && d.siteSurvey.status !== 'pending', owner: 'Surveyor', nextAction: 'Schedule Survey' },
  { id: 'survey-done', label: 'Survey Completed', check: (d) => d.siteSurvey !== null && (d.siteSurvey.status === 'Completed' || d.siteSurvey.status === 'approved'), owner: 'Engineer', nextAction: 'Complete Survey' },
  { id: 'proposal', label: 'Proposal Generated', check: (d) => d.proposal !== null, owner: 'System', nextAction: 'Generate Proposal' },
  { id: 'proposal-sent', label: 'Proposal Viewed', check: () => false, owner: 'Customer' },
  { id: 'proposal-accepted', label: 'Proposal Accepted', check: (d) => d.customer.status === 'Won', owner: 'Customer', nextAction: 'Accept Proposal' },
  { id: 'installation', label: 'Installation Scheduled', check: (d) => d.installation !== null, owner: 'Vendor', nextAction: 'Schedule Installation' },
  { id: 'installation-done', label: 'Installation Completed', check: (d) => d.installation !== null && (d.installation.completionPercentage ?? 0) >= 100, owner: 'Vendor' },
  { id: 'amc', label: 'AMC Activated', check: (d) => d.amc !== null && d.amc.status === 'Active', owner: 'System', nextAction: 'Activate AMC' },
]

function deriveStages(data: CrmCustomer360): JourneyStage[] {
  let activeFound = false
  return STAGE_DEFS.map((def) => {
    const done = def.check(data)
    if (!activeFound && !done) activeFound = true
    const status: 'completed' | 'active' | 'upcoming' = done ? 'completed' : (!activeFound ? 'active' : 'upcoming')
    return {
      id: def.id,
      label: def.label,
      status,
      owner: def.owner,
      nextAction: status === 'active' ? def.nextAction : undefined,
    }
  })
}

export default function CrmJourneyTimeline({ data }: Props) {
  const stages = useMemo(() => deriveStages(data), [data])
  const completed = stages.filter(s => s.status === 'completed').length
  const total = stages.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h4 style={{ margin: 0, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Customer Journey</h4>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{completed}/{total} stages</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', marginBottom: 'var(--space-4)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: 'var(--color-green)', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ display: 'flex', gap: 'var(--space-3)', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
              {stage.status === 'completed' ? (
                <MdCheckCircle size={18} style={{ color: 'var(--color-green)', flexShrink: 0 }} />
              ) : stage.status === 'active' ? (
                <MdSchedule size={18} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
              ) : (
                <MdRadioButtonUnchecked size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              )}
              {i < stages.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: i < stages.length - 1 ? 'var(--space-4)' : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 'var(--font-size-sm)', fontWeight: 500,
                  color: stage.status === 'completed' ? 'var(--color-green)' : stage.status === 'active' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}>{stage.label}</span>
                <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>{stage.owner}</span>
                {stage.status === 'active' && stage.nextAction && (
                  <span style={{
                    fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                    background: 'rgba(245,158,11,0.15)', color: 'var(--color-amber)',
                  }}>
                    {stage.nextAction}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
