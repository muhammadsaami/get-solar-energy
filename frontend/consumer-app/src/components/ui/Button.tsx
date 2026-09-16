import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children?: ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
    color: 'white',
    boxShadow: '0 8px 30px rgba(255, 138, 29, 0.25)',
  },
  secondary: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  danger: {
    background: 'rgba(244, 63, 94, 0.1)',
    color: '#f43f5e',
    border: '1px solid rgba(244, 63, 94, 0.2)',
  },
}

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '13px' },
  md: { padding: '12px 20px', fontSize: '14px' },
  lg: { padding: '14px 28px', fontSize: '15px' },
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all var(--duration-fast) var(--ease-standard)',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : icon ? (
        <span style={{ fontSize: '18px', display: 'flex' }}>{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
