import OfficialLogo from '../brand/OfficialLogo'

interface AuthLogoProps {
  id?: string
  showTagline?: boolean
  height?: number | string
}

export default function AuthLogo({ height = 44 }: AuthLogoProps) {
  return (
    <div className="auth-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
      <OfficialLogo height={height} />
    </div>
  )
}
