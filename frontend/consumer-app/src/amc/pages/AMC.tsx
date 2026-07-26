import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useAMC } from '../hooks/useAMC'
import { AMC_TABS } from '../config/amc.config'
import { mapAMCHealth } from '../mappers/amcMapper'
import { AMCKpiCards } from '../components/AMCKpiCards'
import { AMCContractCard } from '../components/AMCContractCard'
import { AMCHealthCard } from '../components/AMCHealthCard'
import { AMCCoverageDetails } from '../components/AMCCoverageDetails'
import { AMCServiceHistoryTable } from '../components/AMCServiceHistoryTable'
import { AMCVisitTimeline } from '../components/AMCVisitTimeline'
import { AMCAIPromptForm, type AMCAIPromptFormHandle } from '../components/AMCAIPromptForm'
import { AMCRecommendationResult } from '../components/AMCRecommendationResult'
import { AMCLoadingSkeleton } from '../components/AMCLoadingSkeleton'
import { AMCErrorBanner } from '../components/AMCErrorBanner'
import { AMCEmptyState } from '../components/AMCEmptyState'
import { AMCHeroSection } from '../components/AMCHeroSection'
import { AMCRecommendationKpiCards, type AMCRecommendationKpiData } from '../components/AMCRecommendationKpiCards'
import { AMCMaintenanceTimeline } from '../components/AMCMaintenanceTimeline'
import { AMCResultPlaceholder } from '../components/AMCResultPlaceholder'
import { AMCPrintReport } from '../components/AMCPrintReport'
import { saveAMCToLocalStorage, loadAMCFromLocalStorage, clearAMCFromLocalStorage } from '../utils/amcLocalStorage'
import { buildAutofillRequest } from '../utils/amcAutofill'
import { useNotificationStore } from '../../stores/notificationStore'
import DashboardSprites from '../../components/dashboard/DashboardSprites'
import type { AMCRecommendationResult as AMCRecommendationDataType } from '../types/amc.types'

function computeKpiData(recommendation: AMCRecommendationDataType): AMCRecommendationKpiData {
  const plan = recommendation.systemStatus === 'Healthy' ? 'Premium Annual' : 'Standard Quarterly'
  const cost = `\u20B9${Number(recommendation.estimatedServiceCostRs).toLocaleString('en-IN')} / Yr`
  const health = `${recommendation.healthScore}%`
  const warranty = 'Active'
  const nextVisit = recommendation.nextServiceDue
    ? new Date(recommendation.nextServiceDue).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const pmRaw = Math.max(20, Math.min(100, Math.round(100 - recommendation.generationDropPct)))
  const pmScore = `${pmRaw}/100`

  return {
    recommendedPlan: plan,
    estimatedAnnualCost: cost,
    systemHealth: health,
    warrantyStatus: warranty,
    nextScheduledVisit: nextVisit,
    preventiveScore: pmScore,
  }
}

function computeTimelineStep(recommendation: AMCRecommendationDataType): number {
  const score = recommendation.healthScore
  if (score >= 80) return 6
  if (score >= 50) return 4
  return 2
}

export default function AMC() {
  const {
    contract,
    kpis,
    recommendation,
    serviceHistory,
    visits,
    loading,
    recommending,
    tab,
    error,
    refresh,
    getRecommendation,
    setTab,
  } = useAMC()

  const addToast = useNotificationStore((s) => s.addToast)

  const formRef = useRef<AMCAIPromptFormHandle>(null)
  const printReportRef = useRef<{ print: () => void }>(null)
  const formContainerRef = useRef<HTMLDivElement>(null)

  const [restoredRecommendation, setRestoredRecommendation] = useState<AMCRecommendationDataType | null>(null)
  const [timelineStep, setTimelineStep] = useState(1)
  const [initialized, setInitialized] = useState(false)

  const activeRecommendation = recommendation || restoredRecommendation
  const kpiData = activeRecommendation ? computeKpiData(activeRecommendation) : null

  useEffect(() => {
    if (!initialized) {
      const saved = loadAMCFromLocalStorage<AMCRecommendationDataType>()
      if (saved) {
        setRestoredRecommendation(saved)
        setTimelineStep(computeTimelineStep(saved))
      }
      setInitialized(true)
    }
  }, [initialized])

  useEffect(() => {
    if (recommendation) {
      saveAMCToLocalStorage(recommendation)
      setRestoredRecommendation(null)
      setTimelineStep(computeTimelineStep(recommendation))

      addToast({ type: 'success', message: 'AMC O&M evaluation completed successfully!' })
    }
  }, [recommendation, addToast])

  const handleGenerate = useCallback((request: Parameters<typeof getRecommendation>[0]) => {
    getRecommendation(request)
  }, [getRecommendation])

  const handleHeroGenerate = useCallback(() => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollIntoView({ behavior: 'smooth' })
      const firstInput = formContainerRef.current.querySelector('input')
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 400)
      }
    }
  }, [])

  const handleHeroDownload = useCallback(() => {
    if (printReportRef.current) {
      printReportRef.current.print()
    } else {
      addToast({ type: 'info', message: 'No report data generated yet.' })
    }
  }, [addToast])

  const handleResultDownload = useCallback(() => {
    if (printReportRef.current) {
      printReportRef.current.print()
    }
  }, [])

  const handleAutofill = useCallback(() => {
    const values = buildAutofillRequest()
    if (formRef.current) {
      formRef.current.setFormValues(values)
    }
    addToast({ type: 'info', message: 'Autofilled demo AMC data!' })
  }, [addToast])

  const handleReset = useCallback(() => {
    if (formRef.current) {
      formRef.current.resetForm()
    }
    clearAMCFromLocalStorage()
    setRestoredRecommendation(null)
    setTimelineStep(1)
    addToast({ type: 'info', message: 'AMC form cleared.' })
  }, [addToast])

  const moduleInitFailed = !!(error?.hasError && !contract && !serviceHistory.length && !activeRecommendation && !loading)
  const hasContract = !!contract

  const health = activeRecommendation ? mapAMCHealth(activeRecommendation) : null

  return (
    <>
      <DashboardSprites />
      <div className="tab-content" role="tabpanel" aria-label="amc" style={{ display: 'block' }}>
        <div className="tab-header-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="tab-heading">Annual Maintenance Contract</h2>
              <p className="tab-subheading">
                Keep your solar system operating at peak efficiency with predictive maintenance and annual service plans.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={refresh}
              disabled={loading}
              style={{ padding: '8px 16px', fontSize: '11px', width: 'auto', height: 'auto', flexShrink: 0 }}
            >
              {'\uD83D\uDD04'} {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <AMCHeroSection
          onGenerateClick={handleHeroGenerate}
          downloadDisabled={!activeRecommendation}
          onDownload={handleHeroDownload}
        />
        <AMCRecommendationKpiCards data={kpiData} loading={recommending && !activeRecommendation} />
        <AMCMaintenanceTimeline currentStep={timelineStep} />

        <div className="tab-nav-row" style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
          {AMC_TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 16px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                border: 'none', background: tab === t.id ? 'var(--bg-active, rgba(255,255,255,0.06))' : 'transparent',
                color: tab === t.id ? 'var(--text-navy)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {moduleInitFailed && error && (
          <AMCErrorBanner message={error.message} onRetry={refresh} />
        )}

        {loading && <AMCLoadingSkeleton />}

        {!loading && tab === 'overview' && (
          <div>
            {hasContract ? (
              <>
                <AMCKpiCards kpis={kpis} loading={false} />
                <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <AMCContractCard contract={contract} loading={false} />
                  <AMCCoverageDetails contract={contract} loading={false} />
                </div>
                <div style={{ marginTop: '20px' }}>
                  <AMCVisitTimeline visits={visits} loading={false} />
                </div>
              </>
            ) : (
              <AMCEmptyState description="You do not have an active AMC contract. Switch to the AI Recommendation tab to get a professional maintenance report for your solar system." />
            )}
          </div>
        )}

        {!loading && tab === 'history' && (
          <div>
            <AMCServiceHistoryTable records={serviceHistory} loading={false} />
            <div style={{ marginTop: '20px' }}>
              <AMCVisitTimeline visits={visits} loading={false} />
            </div>
          </div>
        )}

        {!loading && tab === 'recommendation' && (
          <div className="amc-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div ref={formContainerRef}>
              <AMCAIPromptForm
                ref={formRef}
                onRecommend={handleGenerate}
                recommending={recommending}
                onAutofill={handleAutofill}
                onReset={handleReset}
              />
            </div>
            <div style={{ position: 'relative' }}>
              {!recommending && !activeRecommendation && !error && (
                <AMCResultPlaceholder />
              )}
              {recommending && (
                <AMCLoadingSkeleton />
              )}
              {!recommending && activeRecommendation && (
                <div>
                  <AMCRecommendationResult result={activeRecommendation} loading={false} onDownload={handleResultDownload} />
                  {health && (
                    <div style={{ marginTop: '16px' }}>
                      <AMCHealthCard health={health} loading={false} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !contract && tab === 'overview' && !moduleInitFailed && (
          <div style={{ marginTop: '16px' }}>
            <AMCEmptyState />
          </div>
        )}

        <AMCPrintReport ref={printReportRef} data={activeRecommendation} />
      </div>
    </>
  )
}
