import React, { useState, useEffect, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdClose, MdOpenInNew } from 'react-icons/md'
import { ROUTES } from '../../config/routes'
import { crmService } from '../../services/crm.service'
import { useCustomer360 } from './useCrmQueries'
import CrmJourneyTimeline from './CrmJourneyTimeline'
import CrmSmartActions from './CrmSmartActions'
import CrmJourneyHealth from './CrmJourneyHealth'
import CrmModuleLinks from './CrmModuleLinks'
import CrmProposalTracking from './CrmProposalTracking'
import type {
  CrmCustomerProfile, CrmCustomer360, CrmBillSummary, CrmRoofAnalysis,
  CrmSurveyInfo, CrmProposalInfo, CrmInstallationInfo, CrmAmcInfo,
  CrmTaskItem, CrmMeetingItem, CrmFollowUpItem, CrmDocumentItem,
  CrmCommunicationItem, TimelineEvent,
} from './crm.types'

interface Props {
  customerId: number | null
  onClose: () => void
}

const SCORE_COLORS = [
  { min: 80, color: 'var(--color-green)', bg: 'rgba(34,197,94,0.15)' },
  { min: 50, color: 'var(--color-amber)', bg: 'rgba(245,158,11,0.15)' },
  { min: 0, color: 'var(--color-red)', bg: 'rgba(239,68,68,0.15)' },
]

function getScoreStyle(score: number) {
  const tier = SCORE_COLORS.find(t => score >= t.min) || SCORE_COLORS[SCORE_COLORS.length - 1]
  return { color: tier.color, background: tier.bg }
}

const STAGE_COLORS: Record<string, string> = {
  'New Lead': 'var(--color-blue)',
  Qualified: 'var(--color-purple)',
  'Site Survey Scheduled': 'var(--color-amber)',
  'Survey Completed': 'var(--color-green)',
  'Proposal Generated': 'var(--color-cyan)',
  'Proposal Sent': 'var(--color-blue)',
  Negotiation: 'var(--color-orange)',
  Won: 'var(--color-green)',
  Closed: 'var(--color-muted)',
  Lost: 'var(--color-red)',
}

/* ───────── Tab definitions ───────── */
interface TabDef {
  id: string
  label: string
  lazy?: boolean
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'bills', label: 'Bills' },
  { id: 'roof', label: 'Roof' },
  { id: 'survey', label: 'Survey' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'roi', label: 'ROI' },
  { id: 'installation', label: 'Installation' },
  { id: 'amc', label: 'AMC' },
  { id: 'timeline', label: 'Timeline', lazy: true },
  { id: 'documents', label: 'Documents', lazy: true },
  { id: 'communications', label: 'Communications', lazy: true },
  { id: 'tasks', label: 'Tasks', lazy: true },
]

export default function CrmCustomer360({ customerId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [closing, setClosing] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const { data: c360, isLoading: loading } = useCustomer360(customerId)
  const data: CrmCustomer360 | null = c360 ?? null

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose(), 300)
  }, [onClose])

  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [documents, setDocuments] = useState<CrmDocumentItem[]>([])
  const [communications, setCommunications] = useState<CrmCommunicationItem[]>([])
  const [subLoading, setSubLoading] = useState<string | null>(null)

  useEffect(() => {
    setActiveTab('overview')
    setTimeline([])
    setDocuments([])
    setCommunications([])
  }, [customerId])

  /* ── lazy-load per tab ── */
  useEffect(() => {
    if (!customerId || !data) return
    if (activeTab === 'timeline' && timeline.length === 0 && !subLoading) {
      setSubLoading('timeline')
      crmService.getCustomerTimeline(customerId).then(setTimeline).finally(() => setSubLoading(null))
    }
    if (activeTab === 'documents' && documents.length === 0 && !subLoading) {
      setSubLoading('documents')
      crmService.getCustomerDocuments(customerId).then(setDocuments).finally(() => setSubLoading(null))
    }
    if (activeTab === 'communications' && communications.length === 0 && !subLoading) {
      setSubLoading('communications')
      crmService.getCustomerCommunications(customerId).then(setCommunications).finally(() => setSubLoading(null))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customerId, data])

  /* ── esc / focus trap ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { handleClose(); return }
    if (e.key === 'Tab') {
      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }, [handleClose])

  useEffect(() => {
    if (customerId) {
      document.body.style.overflow = 'hidden'
      const t = setTimeout(() => drawerRef.current?.querySelector('button')?.focus(), 100)
      return () => { clearTimeout(t); document.body.style.overflow = '' }
    }
  }, [customerId])

  if (!customerId) return null

  return (
    <>
      <div className={`drawer-overlay${closing ? ' drawer-overlay-closing' : ''}`} onClick={handleClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        className={`drawer${closing ? ' drawer-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        style={{ width: '560px', maxWidth: '95vw' }}
      >
        {/* ── Header ── */}
        <HeaderSection customer={data?.customer} loading={loading} onClose={handleClose} />

        {/* ── Tabs ── */}
        <div className="drawer-section-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`drawer-section-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding: '0 var(--space-6) var(--space-6)', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>Loading customer data...</div>
          ) : !data ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>No data available</div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab data={data} customerId={customerId!} />}
              {activeTab === 'bills' && <BillsTab bills={data.bills} />}
              {activeTab === 'roof' && <RoofTab roof={data.roofAnalysis} />}
              {activeTab === 'survey' && <SurveyTab survey={data.siteSurvey} />}
              {activeTab === 'proposal' && <ProposalTab proposal={data.proposal} customerId={customerId!} />}
              {activeTab === 'roi' && <RoiTab data={data} />}
              {activeTab === 'installation' && <InstallationTab installation={data.installation} />}
              {activeTab === 'amc' && <AmcTab amc={data.amc} />}
              {activeTab === 'timeline' && <TimelineTab items={timeline} loading={subLoading === 'timeline'} />}
              {activeTab === 'documents' && <DocumentsTab items={documents} loading={subLoading === 'documents'} />}
              {activeTab === 'communications' && <CommunicationsTab items={communications} loading={subLoading === 'communications'} />}
              {activeTab === 'tasks' && <TasksTab tasks={data.tasks} meetings={data.meetings} followUps={data.followUps} />}
            </>
          )}
        </div>
      </div>
    </>
  )
}

/* ───────── HEADER ───────── */
function HeaderSection({ customer, loading, onClose }: { customer: CrmCustomerProfile | undefined; loading: boolean; onClose: () => void }) {
  return (
    <div style={{ padding: 'var(--space-6) var(--space-6) var(--space-4)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <>
              <div className="skeleton-loader" style={{ width: 120, height: 18, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton-loader" style={{ width: 200, height: 24, borderRadius: 4, marginBottom: 4 }} />
              <div className="skeleton-loader" style={{ width: 160, height: 14, borderRadius: 4 }} />
            </>
          ) : customer ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <span style={{
                  display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-size-xs)', fontWeight: 600,
                          background: STAGE_COLORS[customer.status]
                            ? `${STAGE_COLORS[customer.status]}20` : 'var(--bg-tertiary)',
                          color: STAGE_COLORS[customer.status]
                            ? STAGE_COLORS[customer.status] : 'var(--text-muted)',
                }}>
                  {customer.status}
                </span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {customer.consumerNumber}
                </span>
              </div>
              <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: 'var(--text-primary)' }}>
                {customer.customerName}
              </h2>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', margin: 'var(--space-1) 0 0' }}>
                {customer.city}{customer.discom ? ` · ${customer.discom}` : ''}{customer.salesperson ? ` · Owner: ${customer.salesperson}` : ''}
              </p>
            </>
          ) : (
            <>
              <div className="skeleton-loader" style={{ width: 120, height: 18, borderRadius: 4, marginBottom: 8 }} />
              <div className="skeleton-loader" style={{ width: 200, height: 24, borderRadius: 4 }} />
            </>
          )}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close drawer" style={{ flexShrink: 0 }}>
          <MdClose size={20} />
        </button>
      </div>
    </div>
  )
}

/* ───────── TAB: Overview ───────── */
const OverviewTab = memo(function OverviewTab({ data }: { data: CrmCustomer360; customerId: number }) {
  const c = data.customer
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
        <ScoreCard label="Lead Score" value={data.leadScore} suffix="/100" />
        <ScoreCard label="Health Score" value={data.healthScore} suffix="/100" />
        <ScoreCard label="CLV" value={data.clv} prefix="₹" format="currency" />
      </div>

      {/* Journey Timeline */}
      <CrmJourneyTimeline data={data} />

      {/* Smart Actions */}
      <CrmSmartActions data={data} customerId={c.id} />

      {/* Journey Health */}
      <CrmJourneyHealth data={data} />

      {/* Quick Navigation */}
      <CrmModuleLinks data={data} />

      {/* Customer Details */}
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Customer Details</h4>
        <InfoRow label="Phone" value={c.phone} />
        <InfoRow label="Email" value={c.email} />
        <InfoRow label="Address" value={c.address} />
        <InfoRow label="State" value={c.state} />
        <InfoRow label="Pincode" value={c.pincode} />
        <InfoRow label="Salesperson" value={c.salesperson} />
        <InfoRow label="Created" value={c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'} />
      </div>

      {/* Activity */}
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Activity</h4>
        <InfoRow label="Last Activity" value={data.lastActivity ? new Date(data.lastActivity).toLocaleString() : '—'} />
        <InfoRow label="Last Communication" value={data.lastCommunication ? new Date(data.lastCommunication).toLocaleString() : '—'} />
        <InfoRow label="Next Follow-up" value={data.nextFollowup ? new Date(data.nextFollowup).toLocaleString() : '—'} />
        <InfoRow label="Pipeline Status" value={data.pipelineStatus} />
      </div>
    </div>
  )
})

function ScoreCard({ label, value, suffix, prefix, format }: { label: string; value: number; suffix?: string; prefix?: string; format?: string }) {
  const style = prefix ? { color: 'var(--color-blue)' } : getScoreStyle(value)
  const display = format === 'currency' ? `₹${(value / 100000).toFixed(2)}L` : `${prefix ?? ''}${Math.round(value)}${suffix ?? ''}`
  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, ...style }}>{display}</div>
    </div>
  )
}

/* ───────── TAB: Bills ───────── */
function BillsTab({ bills }: { bills: CrmBillSummary[] }) {
  const navigate = useNavigate()
  if (!bills.length) return <EmptySection message="No bills found for this customer" />
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-3)' }} onClick={() => navigate(ROUTES.BILL_ANALYZER)}>
          <MdOpenInNew size={14} style={{ marginRight: 4 }} />Open Bill Analyzer
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)' }}>
              {['Period', 'Units', 'Amount', 'Rate/Unit', 'Rec kW', 'Monthly Save', 'Annual Save'].map(h => (
                <th key={h} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 500 }}>{b.billingPeriod || new Date(b.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: 'var(--space-3)' }}>{b.monthlyUnits}</td>
                <td style={{ padding: 'var(--space-3)' }}>₹{b.billAmount.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3)' }}>₹{b.perUnitRate.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3)' }}>{b.recommendedKw} kW</td>
                <td style={{ padding: 'var(--space-3)', color: 'var(--color-green)' }}>₹{b.monthlySavings.toLocaleString()}</td>
                <td style={{ padding: 'var(--space-3)', color: 'var(--color-green)' }}>₹{b.annualSavings.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ───────── TAB: Roof ───────── */
function RoofTab({ roof }: { roof: CrmRoofAnalysis | null }) {
  const navigate = useNavigate()
  if (!roof) return <EmptySection message="No roof analysis data available" />
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-3)' }} onClick={() => navigate(ROUTES.ROOF_ANALYSIS)}>
          <MdOpenInNew size={14} style={{ marginRight: 4 }} />Open Roof Analysis
        </button>
      </div>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <InfoRow label="Usable Area" value={`${roof.usableAreaSqft} sq.ft`} />
        <InfoRow label="Suitability Score" value={<span style={{ ...getScoreStyle(roof.suitabilityScore) }}>{roof.suitabilityScore}/100</span>} />
        <InfoRow label="Obstruction Factor" value={roof.obstructionFactor ?? '—'} />
        <InfoRow label="Azimuth Direction" value={roof.azimuthDirection ?? '—'} />
      </div>
    </div>
  )
}

/* ───────── TAB: Survey ───────── */
function SurveyTab({ survey }: { survey: CrmSurveyInfo | null }) {
  const navigate = useNavigate()
  if (!survey) return <EmptySection message="No site survey data available" />
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-outline" style={{ fontSize: 'var(--font-size-xs)', padding: 'var(--space-1) var(--space-3)' }} onClick={() => navigate(ROUTES.SITE_SURVEY)}>
          <MdOpenInNew size={14} style={{ marginRight: 4 }} />Open Site Survey
        </button>
      </div>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <InfoRow label="Status" value={<span style={{ color: survey.status === 'Completed' ? 'var(--color-green)' : survey.status === 'Scheduled' ? 'var(--color-amber)' : 'var(--text-muted)' }}>{survey.status}</span>} />
        <InfoRow label="Surveyor" value={survey.surveyorName} />
        <InfoRow label="Scheduled Date" value={survey.scheduledDate ? new Date(survey.scheduledDate).toLocaleDateString() : '—'} />
        <InfoRow label="Completed Date" value={survey.completedDate ? new Date(survey.completedDate).toLocaleDateString() : '—'} />
        <InfoRow label="Findings" value={survey.findings} />
      </div>
    </div>
  )
}

/* ───────── TAB: Proposal ───────── */
function ProposalTab({ proposal, customerId }: { proposal: CrmProposalInfo | null; customerId?: number }) {
  if (!proposal) return <EmptySection message="No proposal data available" />
  return <CrmProposalTracking customerId={customerId} />
}

/* ───────── TAB: ROI ───────── */
function RoiTab({ data }: { data: CrmCustomer360 }) {
  const { proposal, bills } = data
  const latestBill = bills.length > 0 ? bills[bills.length - 1] : null
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Latest Bill</h4>
        <InfoRow label="Monthly Consumption" value={latestBill ? `${latestBill.monthlyUnits} units` : '—'} />
        <InfoRow label="Bill Amount" value={latestBill ? `₹${latestBill.billAmount.toLocaleString()}` : '—'} />
        <InfoRow label="Per Unit Rate" value={latestBill ? `₹${latestBill.perUnitRate.toFixed(2)}` : '—'} />
        <InfoRow label="Monthly Savings" value={latestBill ? <span style={{ color: 'var(--color-green)' }}>₹{latestBill.monthlySavings.toLocaleString()}</span> : '—'} />
        <InfoRow label="Annual Savings" value={latestBill ? <span style={{ color: 'var(--color-green)' }}>₹{latestBill.annualSavings.toLocaleString()}</span> : '—'} />
      </div>
      {proposal && (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
          <h4 style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Proposal ROI</h4>
          <InfoRow label="System Cost" value={`₹${proposal.netSystemCost?.toLocaleString() ?? '—'}`} />
          <InfoRow label="25-Year Savings" value={proposal.savings25yr ? <span style={{ color: 'var(--color-green)' }}>₹{proposal.savings25yr.toLocaleString()}</span> : '—'} />
          <InfoRow label="Payback Period" value={proposal.paybackYears ? `${proposal.paybackYears} years` : '—'} />
        </div>
      )}
    </div>
  )
}

/* ───────── TAB: Installation ───────── */
function InstallationTab({ installation }: { installation: CrmInstallationInfo | null }) {
  if (!installation) return <EmptySection message="No installation data available" />
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Completion</span>
          <span style={{ fontWeight: 600 }}>{installation.completionPercentage ?? 0}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--bg-card)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(installation.completionPercentage ?? 0, 100)}%`, height: '100%', borderRadius: 4, background: 'var(--color-green)' }} />
        </div>
      </div>
      <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
        <InfoRow label="Current Stage" value={installation.currentStage} />
        <InfoRow label="Assigned Engineer" value={installation.assignedEngineer} />
      </div>
    </div>
  )
}

/* ───────── TAB: AMC ───────── */
function AmcTab({ amc }: { amc: CrmAmcInfo | null }) {
  if (!amc) return <EmptySection message="No AMC data available" />
  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 'var(--font-size-sm)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
      <InfoRow label="Contract Number" value={amc.contractNumber} />
      <InfoRow label="Warranty Status" value={amc.warrantyStatus} />
      <InfoRow label="Service Frequency" value={amc.serviceFrequency} />
      <InfoRow label="Next Service" value={amc.nextService ? new Date(amc.nextService).toLocaleDateString() : '—'} />
      <InfoRow label="Expiry Date" value={amc.expiryDate ? new Date(amc.expiryDate).toLocaleDateString() : '—'} />
      <InfoRow label="Status" value={amc.status} />
    </div>
  )
}

/* ───────── TAB: Timeline ───────── */
function TimelineTab({ items, loading }: { items: TimelineEvent[]; loading: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading timeline...</div>
  if (!items.length) return <EmptySection message="No timeline events found" />
  return (
    <div style={{ position: 'relative' }}>
      {items.map((ev, i) => (
        <div key={ev.id} style={{ display: 'flex', gap: 'var(--space-3)', paddingBottom: 'var(--space-4)', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ev.eventType === 'system' ? 'var(--color-purple)' : 'var(--color-blue)', flexShrink: 0 }} />
            {i < items.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{ev.eventType}</span>
              <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>{ev.module}</span>
              <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>by {ev.user}</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{ev.notes || ev.status}</div>
            <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', marginTop: 2 }}>{new Date(ev.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── TAB: Documents ───────── */
function DocumentsTab({ items, loading }: { items: CrmDocumentItem[]; loading: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading documents...</div>
  if (!items.length) return <EmptySection message="No documents uploaded" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {items.map(doc => (
        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{doc.originalFilename}</div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-2)' }}>
              <span>{doc.documentType}</span>
              <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
              <span style={{ color: doc.verificationStatus === 'Verified' ? 'var(--color-green)' : doc.verificationStatus === 'Pending' ? 'var(--color-amber)' : 'var(--text-muted)' }}>{doc.verificationStatus}</span>
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {new Date(doc.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── TAB: Communications ───────── */
function CommunicationsTab({ items, loading }: { items: CrmCommunicationItem[]; loading: boolean }) {
  if (loading) return <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>Loading communications...</div>
  if (!items.length) return <EmptySection message="No communications recorded" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {items.map(comm => (
        <div key={comm.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{comm.subject}</span>
            <span style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>
              <span style={{
                display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                background: comm.channel === 'Email' ? 'rgba(59,130,246,0.15)' : comm.channel === 'Call' ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
                color: comm.channel === 'Email' ? 'var(--color-blue)' : comm.channel === 'Call' ? 'var(--color-green)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-2xs)', marginRight: 8,
              }}>
                {comm.channel}
              </span>
              {new Date(comm.createdAt).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>{comm.message}</div>
          <div style={{ fontSize: 'var(--font-size-2xs)', color: 'var(--text-muted)' }}>
            {comm.sender} → {comm.receiver} · {comm.deliveryStatus}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ───────── TAB: Tasks ───────── */
function TasksTab({ tasks, meetings, followUps }: { tasks: CrmTaskItem[]; meetings: CrmMeetingItem[]; followUps: CrmFollowUpItem[] }) {
  if (!tasks.length && !meetings.length && !followUps.length) return <EmptySection message="No tasks, meetings, or follow-ups" />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {tasks.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Tasks ({tasks.length})</h4>
          {tasks.map(t => (
            <div key={t.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{t.title}</span>
                <span style={{
                  fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                  background: t.priority === 'High' ? 'rgba(239,68,68,0.15)' : t.priority === 'Medium' ? 'rgba(245,158,11,0.15)' : 'var(--bg-card)',
                  color: t.priority === 'High' ? 'var(--color-red)' : t.priority === 'Medium' ? 'var(--color-amber)' : 'var(--text-muted)',
                }}>{t.priority}</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                {t.assignedTo ? `${t.assignedTo} · ` : ''}{t.status}{t.dueDate ? ` · Due: ${new Date(t.dueDate).toLocaleDateString()}` : ''}
              </div>
              {t.progress != null && (
                <div style={{ marginTop: 'var(--space-2)', height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${t.progress}%`, height: '100%', borderRadius: 2, background: 'var(--color-blue)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {meetings.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Meetings ({meetings.length})</h4>
          {meetings.map(m => (
            <div key={m.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
              <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{m.title}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                {m.meetingType} · {m.assignedTo ? `${m.assignedTo} · ` : ''}{m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : ''}{m.scheduledTime ? ` ${m.scheduledTime}` : ''}
              </div>
              {m.outcome && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>Outcome: {m.outcome}</div>}
            </div>
          ))}
        </div>
      )}
      {followUps.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>Follow-ups ({followUps.length})</h4>
          {followUps.map(f => (
            <div key={f.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{f.title}</span>
                <span style={{
                  fontSize: 'var(--font-size-2xs)', padding: '1px 6px', borderRadius: 'var(--radius-full)',
                  background: f.status === 'Open' ? 'rgba(245,158,11,0.15)' : f.status === 'Completed' ? 'rgba(34,197,94,0.15)' : 'var(--bg-card)',
                  color: f.status === 'Open' ? 'var(--color-amber)' : f.status === 'Completed' ? 'var(--color-green)' : 'var(--text-muted)',
                }}>{f.status}</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 2 }}>
                {f.priority}{f.dueDate ? ` · Due: ${new Date(f.dueDate).toLocaleDateString()}` : ''}
              </div>
              {f.notes && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>{f.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────── Empty ───────── */
function EmptySection({ message }: { message: string }) {
  return <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{message}</div>
}
