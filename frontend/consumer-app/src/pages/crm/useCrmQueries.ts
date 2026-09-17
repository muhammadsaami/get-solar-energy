import { useQuery } from '@tanstack/react-query'
import { crmService } from '../../services/crm.service'
import type { CrmPipelineMetrics, CrmAlert, CrmCustomer360 } from './crm.types'

export const crmKeys = {
  pipelineMetrics: ['crm', 'pipeline-metrics'] as const,
  alerts: ['crm', 'alerts'] as const,
  customer360: (id: number) => ['crm', 'customer360', id] as const,
  customerTimeline: (id: number) => ['crm', 'timeline', id] as const,
  customerDocuments: (id: number) => ['crm', 'documents', id] as const,
  customerCommunications: (id: number) => ['crm', 'communications', id] as const,
}

export function useCrmPipelineMetrics() {
  return useQuery<CrmPipelineMetrics | null>({
    queryKey: crmKeys.pipelineMetrics,
    queryFn: () => crmService.getPipelineMetrics(),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCrmAlerts() {
  return useQuery<CrmAlert[]>({
    queryKey: crmKeys.alerts,
    queryFn: () => crmService.getAlerts(),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCustomer360(id: number | null) {
  return useQuery<CrmCustomer360 | null>({
    queryKey: crmKeys.customer360(id!),
    queryFn: () => crmService.getCustomer360(id!),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  })
}
