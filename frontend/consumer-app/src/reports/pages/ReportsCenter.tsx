import React, { useCallback, useState } from 'react'
import { useReportsCenter } from '../hooks/useReportsCenter'
import { ReportsSummaryCards } from '../components/ReportsSummaryCards'
import { QuickActionsBar } from '../components/QuickActionsBar'
import { ReportTemplateCard } from '../components/ReportTemplateCard'
import { ReportsHistoryTable } from '../components/ReportsHistoryTable'
import { ReportsEmptyState } from '../components/ReportsEmptyState'
import { ReportPreviewModal } from '../components/ReportPreviewModal'
import { REPORT_TEMPLATES } from '../config/reportTemplates'
import { exportCSV, exportJSON } from '../utils/reportExport'
import { useNotificationStore } from '../../stores/notificationStore'

const CSV_COLUMNS = [
  { key: 'source', label: 'Source' },
  { key: 'title', label: 'Report' },
  { key: 'description', label: 'Summary' },
  { key: 'timestamp', label: 'Date' },
  { key: 'status', label: 'Status' },
]

function itemToRow(item: unknown) {
  const r = (item || {}) as Record<string, unknown>
  return {
    source: String(r.source || ''),
    title: String(r.title || ''),
    description: String(r.description || ''),
    timestamp: String(r.relativeTime || r.timestamp || ''),
    status: String(r.status || ''),
  }
}

export default function ReportsCenter() {
  const {
    summaryCards,
    reportItems,
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
  const addToast = useNotificationStore((s) => s.addToast)

  const downloadItems = useCallback((items: unknown[], name: string) => {
    const rows = items.map(itemToRow).filter((r) => r.title)
    if (rows.length === 0) {
      addToast({ type: 'info', message: 'No data available to export for this report yet.' })
      return
    }
    exportCSV(rows, CSV_COLUMNS, name)
  }, [addToast])

  const handleGenerate = useCallback((templateId: string) => {
    const template = REPORT_TEMPLATES.find((t) => t.id === templateId)
    const items = reportItems.filter((r) => (r.templateId || r.source) === templateId)
    if (!template) return
    setGeneratingTemplateId(templateId)
    try {
      const rows = items.map((item) => ({
        title: item.title,
        description: item.description,
        status: item.status,
      })).filter((r) => r.title)
      if (rows.length === 0) {
        addToast({ type: 'info', message: template.emptyStateMessage || 'Complete the assessment to generate this report.' })
        return
      }
      exportJSON({ template: template.title, generatedAt: new Date().toISOString(), rows }, `${templateId}-report`)
      addHistoryItem({
        id: `report-${templateId}-${Date.now()}`,
        reportName: template.title,
        version: 1,
        createdDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        downloadCount: 0,
        status: 'completed',
        templateId,
      })
    } finally {
      setGeneratingTemplateId(null)
    }
  }, [reportItems, addHistoryItem, setGeneratingTemplateId, addToast])

  const handlePreview = useCallback((templateId: string) => {
    setPreviewTemplateId(templateId)
  }, [])

  const handleDownload = useCallback((templateId: string) => {
    downloadItems(reportItems.filter((r) => (r.templateId || r.source) === templateId), `${templateId}-reports`)
  }, [reportItems, downloadItems])

  const handleGenerateAll = useCallback(() => {
    REPORT_TEMPLATES.forEach((t) => {
      handleGenerate(t.id)
    })
  }, [handleGenerate])

  const handleDownloadLatest = useCallback(() => {
    downloadItems(reportItems, 'solar-intelligence-reports')
  }, [reportItems, downloadItems])

  const handleCsvExport = useCallback((type: string) => {
    const kind = type === 'combined' ? null : type
    const items = kind ? reportItems.filter((r) => (r.templateId || r.source) === kind) : reportItems
    downloadItems(items, `${type}-reports`)
  }, [reportItems, downloadItems])

  const handleDownloadHistory = useCallback((item: { reportName: string }) => {
    exportJSON(item, item.reportName || 'report')
  }, [])

  const hasAnyItems = history.length > 0

  return (
    <div className="ew-page" role="tabpanel" aria-label="reports center">

      {error?.hasError && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            fontSize: '12px',
            color: 'var(--color-red)',
            fontWeight: 600,
          }}
        >
          {error.message}
        </div>
      )}

      {!hasAnyItems && !loading && <ReportsEmptyState />}

      <div id="reportsContentContainer" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <ReportsSummaryCards summary={summaryCards} />
        <QuickActionsBar
          onGenerateAll={handleGenerateAll}
          onDownloadLatest={handleDownloadLatest}
          onCsvExport={handleCsvExport}
          loading={loading}
        />

        <div>
          <div className="ew-divider-head">
            <h3 className="ew-divider-title">Standardized Export Templates</h3>
            <span className="ew-divider-sub">Compliant with MNRE &amp; DISCOM audit specifications</span>
          </div>

          <div
            className="reports-templates-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}
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
        </div>

        <ReportsHistoryTable
          history={history}
          search={filters.search}
          onSearchChange={setSearch}
          onDownload={handleDownloadHistory}
        />
      </div>

      <ReportPreviewModal
        templateId={previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
      />
    </div>
  )
}
