import { useNotificationStore } from '../../stores/notificationStore'

export function useVendorNotify() {
  const addToast = useNotificationStore((s) => s.addToast)
  return (message: string) => addToast({ type: 'info', message })
}