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

export default function EarningsPage() {
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
      <EarningsHero onExportClick={() => alert('Downloading full earnings statement CSV/PDF')} />

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
