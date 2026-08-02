import React from 'react'
import { useWorkOrders } from '../hooks/useWorkOrders'
import WorkOrdersHero from '../components/WorkOrdersHero'
import WorkOrdersKPIs from '../components/WorkOrdersKPIs'
import WorkOrderSearchBar from '../components/WorkOrderSearchBar'
import WorkOrderTabs from '../components/WorkOrderTabs'
import WorkOrderGrid from '../components/WorkOrderGrid'
import WorkOrderDrawer from '../components/WorkOrderDrawer'
import WorkOrderDrawerContent from '../components/WorkOrderDrawerContent'
import WorkOrdersSkeleton from '../components/WorkOrdersSkeleton'
import WorkOrdersEmptyState from '../components/WorkOrdersEmptyState'
import '../styles/work-orders.css'

export default function WorkOrdersPage() {
  const {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    selectedWorkOrder,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleUpdateStatus,
    updatingId,
    filteredWorkOrders,
    reload,
  } = useWorkOrders()

  if (loading) {
    return <WorkOrdersSkeleton />
  }

  if (error) {
    return <WorkOrdersEmptyState error={error} onRetry={reload} />
  }

  if (!data || data.raw.length === 0) {
    return <WorkOrdersEmptyState onRetry={reload} />
  }

  return (
    <div className="work-orders-container">
      <WorkOrdersHero onStartNextClick={() => setActiveTab('inProgress')} />

      <WorkOrdersKPIs summary={data.summary} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <WorkOrderTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={data.raw.length}
          assignedCount={data.assigned.length}
          inProgressCount={data.inProgress.length}
          completedCount={data.completed.length}
        />

        <WorkOrderSearchBar filters={filters} onFilterChange={setFilters} />
      </div>

      <WorkOrderGrid
        orders={filteredWorkOrders}
        onSelect={openDrawer}
        onUpdateStatus={handleUpdateStatus}
        updatingId={updatingId}
      />

      {/* Reusable Work Order Drawer */}
      <WorkOrderDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedWorkOrder ? selectedWorkOrder.jobTitle : 'Work Order Details'}
      >
        {selectedWorkOrder && (
          <WorkOrderDrawerContent
            order={selectedWorkOrder}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={updatingId === selectedWorkOrder.id}
          />
        )}
      </WorkOrderDrawer>
    </div>
  )
}
