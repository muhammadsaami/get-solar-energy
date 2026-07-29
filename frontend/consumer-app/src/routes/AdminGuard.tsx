import PermissionGuard from './PermissionGuard'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  return (
    <PermissionGuard feature="admin-dashboard">
      {children}
    </PermissionGuard>
  )
}
