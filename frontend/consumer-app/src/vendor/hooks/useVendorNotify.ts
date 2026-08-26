import { useCallback } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';

export function useVendorNotify() {
  const addToast = useNotificationStore((s) => s.addToast);
  return useCallback((message: string) => addToast({ type: 'info', message }), [addToast]);
}