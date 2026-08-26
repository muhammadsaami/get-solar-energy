import React, { useState, useEffect } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorNotify } from '../hooks/useVendorNotify'

const VENDOR_STORAGE_EXTRAS = 'gse_vendor_profile_extras'

interface VendorProfileState {
  businessName: string
  email: string
  phone: string
  gstin: string
  mnreCategory: string
  operatingRegions: string
  empaneledDiscoms: string
  capacityLimit: string
  complianceStatus: 'Verified' | 'Pending' | 'In Review'
}

function loadVendorExtras(): Partial<VendorProfileState> {
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_EXTRAS)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveVendorExtras(extras: Partial<VendorProfileState>) {
  try {
    localStorage.setItem(VENDOR_STORAGE_EXTRAS, JSON.stringify(extras))
  } catch {
    // Best-effort storage
  }
}

export function VendorProfile() {
  const notify = useVendorNotify()
  const auth = useAuth() as unknown as {
    user?: { name?: string; email?: string; phone?: string }
    token?: string | null
    setSession?: (token: string | null, user: Record<string, unknown>) => void
  }
  const user = auth?.user

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [profile, setProfile] = useState<VendorProfileState>(() => {
    const extras = loadVendorExtras()
    return {
      businessName: String(extras.businessName || user?.name || 'Solar EPC Partner'),
      email: String(extras.email || user?.email || ''),
      phone: String(extras.phone || user?.phone || ''),
      gstin: String(extras.gstin || ''),
      mnreCategory: String(extras.mnreCategory || 'Empaneled EPC Vendor'),
      operatingRegions: String(extras.operatingRegions || 'North India Region'),
      empaneledDiscoms: String(extras.empaneledDiscoms || 'State DISCOM Interconnection'),
      capacityLimit: String(extras.capacityLimit || 'Rooftop & Commercial Projects'),
      complianceStatus: 'Verified',
    }
  })

  const [formData, setFormData] = useState<VendorProfileState>(profile)

  useEffect(() => {
    if (user?.name || user?.email) {
      setProfile((prev) => {
        const extras = loadVendorExtras()
        return {
          ...prev,
          businessName: String(extras.businessName || user?.name || prev.businessName),
          email: String(extras.email || user?.email || prev.email),
        }
      })
    }
  }, [user])

  const handleInputChange = (field: keyof VendorProfileState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {}
    if (!formData.businessName.trim()) {
      nextErrors.businessName = 'Business name is required'
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Contact email is required'
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required'
    }
    if (!formData.gstin.trim()) {
      nextErrors.gstin = 'GSTIN is required'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    setSaving(true)
    setTimeout(() => {
      saveVendorExtras(formData)
      setProfile(formData)
      if (auth.setSession && auth.token && user) {
        auth.setSession(auth.token, {
          ...user,
          name: formData.businessName,
          email: formData.email,
          phone: formData.phone,
        })
      }
      setSaving(false)
      setIsEditing(false)
      notify('Organization details updated successfully')
    }, 200)
  }

  const handleCancel = () => {
    setFormData(profile)
    setErrors({})
    setIsEditing(false)
  }

  const initials = profile.businessName
    ? profile.businessName.slice(0, 2).toUpperCase()
    : 'VE'

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <DashboardHeader
        title="Vendor Organization Profile"
        subtitle="Verified EPC partner credentials, DISCOM empanelment &amp; operational compliance."
        badgeText="Verified Partner"
        actions={
          !isEditing ? (
            <button
              type="button"
              className="vendor-btn-secondary"
              onClick={() => {
                setFormData(profile)
                setIsEditing(true)
              }}
            >
              ✏ Edit Organization Details
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="vendor-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
              <button
                type="button"
                className="vendor-btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          )
        }
      />

      <div className="vendor-glass-card" style={{ padding: '24px' }}>
        {/* Top Profile Summary Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(23, 168, 229, 0.15)',
              border: '2px solid var(--vendor-primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--vendor-primary)',
              boxShadow: '0 0 24px rgba(23, 168, 229, 0.35)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  margin: 0,
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {profile.businessName}
              </h2>
              <StatusBadge status={profile.complianceStatus} />
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--vendor-text-secondary)',
                margin: '4px 0 0',
              }}
            >
              {profile.mnreCategory} &middot; GSTIN: {profile.gstin}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--vendor-text-muted)',
                margin: '2px 0 0',
              }}
            >
              {profile.email} &middot; +91 {profile.phone}
            </p>
          </div>
        </div>

        {/* View vs Edit Mode */}
        {!isEditing ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              fontSize: '13px',
            }}
          >
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--vendor-text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Operating Regions
              </span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                {profile.operatingRegions}
              </span>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--vendor-text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Empaneled DISCOMs
              </span>
              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                {profile.empaneledDiscoms}
              </span>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--vendor-text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Installation Capacity Limit
              </span>
              <span style={{ color: 'var(--vendor-primary)', fontWeight: 700 }}>
                {profile.capacityLimit}
              </span>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--vendor-text-muted)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                Accreditation Status
              </span>
              <span style={{ color: '#36d399', fontWeight: 600 }}>
                Active Category-A Partner
              </span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                Business / Organization Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${errors.businessName ? 'var(--vendor-accent)' : 'var(--vendor-border)'}`,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {errors.businessName && <span style={{ fontSize: '10px', color: 'var(--vendor-accent)' }}>{errors.businessName}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${errors.email ? 'var(--vendor-accent)' : 'var(--vendor-border)'}`,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {errors.email && <span style={{ fontSize: '10px', color: 'var(--vendor-accent)' }}>{errors.email}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                Primary Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${errors.phone ? 'var(--vendor-accent)' : 'var(--vendor-border)'}`,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {errors.phone && <span style={{ fontSize: '10px', color: 'var(--vendor-accent)' }}>{errors.phone}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                GSTIN *
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => handleInputChange('gstin', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${errors.gstin ? 'var(--vendor-accent)' : 'var(--vendor-border)'}`,
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              {errors.gstin && <span style={{ fontSize: '10px', color: 'var(--vendor-accent)' }}>{errors.gstin}</span>}
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                Operating Regions
              </label>
              <input
                type="text"
                value={formData.operatingRegions}
                onChange={(e) => handleInputChange('operatingRegions', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--vendor-border)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vendor-text-secondary)', textTransform: 'uppercase' }}>
                Empaneled DISCOMs
              </label>
              <input
                type="text"
                value={formData.empaneledDiscoms}
                onChange={(e) => handleInputChange('empaneledDiscoms', e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--vendor-border)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default VendorProfile
