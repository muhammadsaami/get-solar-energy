import { useNotificationStore } from '../../stores/notificationStore'

export default function ToastHost() {
  const toasts = useNotificationStore((s) => s.toasts)
  const removeToast = useNotificationStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`auth-toast ${toast.type} show`}
          role="status"
          aria-live="polite"
          onClick={() => removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </>
  )
}
