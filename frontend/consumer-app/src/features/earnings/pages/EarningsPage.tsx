import React from 'react'
import { useEarnings } from '../hooks/useEarnings'
import EarningsHero from '../components/EarningsHero'
import EarningsKPIs from '../components/EarningsKPIs'
import EarningsSearchBar from '../components/EarningsSearchBar'
import EarningsTabs from '../components/EarningsTabs'
import EarningsGrid from '../components/EarningsGrid'
import PayoutDrawer from '../components/PayoutDrawer'
import PayoutDrawerContent from '../components/PayoutDrawerContent'
import EarningsSkeleton from '../components/EarningsSkeleton'
import EarningsEmptyState from '../components/EarningsEmptyState'
import '../styles/earnings.css'
import { useNotificationStore } from '../../../stores/notificationStore'
import { exportCSV } from '../../../reports/utils/reportExport'
import type { CanonicalEarning } from '../types/earnings.types'

export default function EarningsPage() {
  const addToast = useNotificationStore((s) => s.addToast)
  const {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    selectedEarning,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    filteredEarnings,
    reload,
  } = useEarnings()

  if (loading) {
    return <EarningsSkeleton />
  }

  if (error) {
    return <EarningsEmptyState error={error} onRetry={reload} />
  }

  if (!data || data.raw.length === 0) {
    return <EarningsEmptyState onRetry={reload} />
  }

  return (
    <div className="earnings-container">
      <EarningsHero
        onExportClick={() => {
          const rows: CanonicalEarning[] = filteredEarnings
          if (rows.length === 0) {
            addToast({ type: 'warning', message: 'No earnings rows to export.' })
            return
          }
          exportCSV(
            rows.map((e) => ({
              id: e.id,
              workOrderId: e.workOrderId,
              workOrderTitle: e.workOrderTitle,
              jobType: e.jobType,
              amount: e.amount,
              payoutStatus: e.payoutStatus,
              paymentMethod: e.paymentMethod,
              transactionRef: e.transactionRef,
              createdAt: e.createdAt,
              paidAt: e.paidAt ?? '',
            })),
            [
              { key: 'id', label: 'Earning ID' },
              { key: 'workOrderId', label: 'Work Order ID' },
              { key: 'workOrderTitle', label: 'Work Order' },
              { key: 'jobType', label: 'Job Type' },
              { key: 'amount', label: 'Amount (INR)' },
              { key: 'payoutStatus', label: 'Payout Status' },
              { key: 'paymentMethod', label: 'Payment Method' },
              { key: 'transactionRef', label: 'Transaction Ref' },
              { key: 'createdAt', label: 'Created At' },
              { key: 'paidAt', label: 'Paid At' },
            ],
            'earnings-statement',
          )
          addToast({ type: 'success', message: `Exported ${rows.length} earnings to earnings-statement.csv` })
        }}
      />

      <EarningsKPIs summary={data.summary} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <EarningsTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={data.raw.length}
          paidCount={data.paid.length}
          pendingCount={data.pending.length}
          processingCount={data.processing.length}
        />

        <EarningsSearchBar filters={filters} onFilterChange={setFilters} />
      </div>

      <EarningsGrid earnings={filteredEarnings} onSelect={openDrawer} />

      {/* Reusable Payout Transaction Drawer */}
      <PayoutDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedEarning ? selectedEarning.workOrderTitle : 'Payout Transaction Details'}
      >
        {selectedEarning && <PayoutDrawerContent earning={selectedEarning} />}
      </PayoutDrawer>
    </div>
  )
}
