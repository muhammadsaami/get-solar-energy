import React, { useCallback, useState } from 'react'
import { useReportsCenter } from '../hooks/useReportsCenter'
import { ReportsSummaryCards } from '../components/ReportsSummaryCards'
import { QuickActionsBar } from '../components/QuickActionsBar'
import { ReportTemplateCard } from '../components/ReportTemplateCard'
import { ReportsHistoryTable } from '../components/ReportsHistoryTable'
import { ReportsEmptyState } from '../components/ReportsEmptyState'
import { ReportPreviewModal } from '../components/ReportPreviewModal'
import { REPORT_TEMPLATES } from '../config/reportTemplates'
import DashboardSprites from '../../components/dashboard/DashboardSprites'

export default function ReportsCenter() {
  const {
    summaryCards,
    history,
    loading,
    error,
    filters,
    generatingTemplateId,
    setSearch,
    addHistoryItem,
    setGeneratingTemplateId,
  } = useReportsCenter()

  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)

  const handleGenerate = useCallback((templateId: string) => {
    setGeneratingTemplateId(templateId)
    setTimeout(() => {
      addHistoryItem({
        id: `report-${templateId}-${Date.now()}`,
        reportName: REPORT_TEMPLATES.find((t) => t.id === templateId)?.title || templateId,
        version: 1,
        createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        downloadCount: 0,
        status: 'completed',
        templateId,
      })
      setGeneratingTemplateId(null)
    }, 1500)
  }, [addHistoryItem, setGeneratingTemplateId])

  const handlePreview = useCallback((templateId: string) => {
    setPreviewTemplateId(templateId)
  }, [])

  const handleDownload = useCallback((_templateId: string) => {
    // PDF generation not available — button is disabled via template config
  }, [])

  const handleGenerateAll = useCallback(() => {
    REPORT_TEMPLATES.forEach((t) => {
      if (t.generateConfig.endpoint) {
        handleGenerate(t.id)
      }
    })
  }, [handleGenerate])

  const handleDownloadLatest = useCallback(() => {
    // No-op: no backend support
  }, [])

  const handleCsvExport = useCallback((_type: string) => {
    // No-op: buttons disabled, CSV via API coming soon
  }, [])

  const hasAnyItems = history.length > 0

  return (
    <>
      <DashboardSprites />
      <div className="tab-content" role="tabpanel" aria-label="reports center" style={{ display: 'block' }}>
        <div className="tab-header-block">
          <h2 className="tab-heading">Reports & PDF Export Center</h2>
          <p className="tab-subheading">Generate, preview, and download custom, executive-ready Solar Intelligence reports and spreadsheets.</p>
        </div>

        {error?.hasError && (
          <div
            style={{
              marginBottom: '16px',
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(231, 76, 60, 0.06)',
              border: '1px dashed rgba(231, 76, 60, 0.3)',
              textAlign: 'center',
              fontSize: '12px',
              color: '#ef4444',
              fontWeight: 600,
            }}
          >
            {error.message}
          </div>
        )}

        {!hasAnyItems && !loading && <ReportsEmptyState />}

        <div id="reportsContentContainer" style={{ display: 'block' }}>
          <ReportsSummaryCards summary={summaryCards} />
          <QuickActionsBar
            onGenerateAll={handleGenerateAll}
            onDownloadLatest={handleDownloadLatest}
            onCsvExport={handleCsvExport}
            loading={loading}
          />

          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Report Templates
            </h3>
          </div>
          <div
            className="reports-templates-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '25px' }}
          >
            {REPORT_TEMPLATES.sort((a, b) => a.displayOrder - b.displayOrder).map((template) => (
              <ReportTemplateCard
                key={template.id}
                template={template}
                generating={generatingTemplateId === template.id}
                onGenerate={handleGenerate}
                onPreview={handlePreview}
                onDownload={handleDownload}
              />
            ))}
          </div>

          <ReportsHistoryTable
            history={history}
            search={filters.search}
            onSearchChange={setSearch}
          />

        </div>

        <ReportPreviewModal
          templateId={previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
        />
      </div>
    </>
  )
}
