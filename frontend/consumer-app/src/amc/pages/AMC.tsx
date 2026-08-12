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
    <div className="ew-page" role="tabpanel" aria-label="amc">
      <header className="ew-mission-bar" role="banner" aria-label="AMC Command Bar">
        <div className="ew-mission-scope">
          <span className="ew-live-dot" />
          <span className="ew-scope-badge">O&amp;M / AMC-MAINTENANCE</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Annual Maintenance &amp; Predictive Servicing</span>
        </div>

        <div className="ew-mission-stats">
          <div className="ew-mission-stat-item">
            <span>Contract:</span>
            <strong style={{ color: hasContract ? 'var(--color-green)' : 'var(--color-orange)' }}>
              {hasContract ? 'ACTIVE' : 'EVALUATION'}
            </strong>
          </div>
          {kpiData && (
            <div className="ew-mission-stat-item">
              <span>Health Score:</span>
              <strong style={{ color: 'var(--color-cyan)' }}>{kpiData.systemHealth}</strong>
            </div>
          )}
        </div>

        <div className="ew-mission-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={refresh}
            disabled={loading}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            {loading ? 'Refreshing...' : 'Refresh Status'}
          </button>
        </div>
      </header>

      <AMCHeroSection
        onGenerateClick={handleHeroGenerate}
        downloadDisabled={!activeRecommendation}
        onDownload={handleHeroDownload}
      />
      <AMCRecommendationKpiCards data={kpiData} loading={recommending && !activeRecommendation} />
      <AMCMaintenanceTimeline currentStep={timelineStep} />

      <div className="card-glass" style={{ padding: '4px 6px' }}>
        <div className="ew-nav-pill-bar">
          {AMC_TABS.map((t) => (
            <button
              key={t.id}
              className={`ew-nav-pill ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {moduleInitFailed && error && (
        <AMCErrorBanner message={error.message} onRetry={refresh} />
      )}

      {loading && <AMCLoadingSkeleton />}

      {!loading && tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {hasContract ? (
            <>
              <AMCKpiCards kpis={kpis} loading={false} />
              <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <AMCContractCard contract={contract} loading={false} />
                <AMCCoverageDetails contract={contract} loading={false} />
              </div>
              <div>
                <AMCVisitTimeline visits={visits} loading={false} />
              </div>
            </>
          ) : (
            <AMCEmptyState description="You do not have an active AMC contract. Switch to the AI Recommendation tab to get a professional maintenance report for your solar system." />
          )}
        </div>
      )}

      {!loading && tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <AMCServiceHistoryTable records={serviceHistory} loading={false} />
          <AMCVisitTimeline visits={visits} loading={false} />
        </div>
      )}

      {!loading && tab === 'recommendation' && (
        <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <AMCRecommendationResult result={activeRecommendation} loading={false} onDownload={handleResultDownload} />
                {health && (
                  <AMCHealthCard health={health} loading={false} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !contract && tab === 'overview' && !moduleInitFailed && (
        <AMCEmptyState />
      )}

      <AMCPrintReport ref={printReportRef} data={activeRecommendation} />
    </div>
  )
}
