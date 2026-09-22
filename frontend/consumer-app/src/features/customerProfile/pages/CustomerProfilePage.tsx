import React, { useRef, useState, useEffect } from 'react'
import { useCustomerProfile } from '../hooks/useCustomerProfile'
import { resolveAvatarUrl } from '../../../utils/avatar'
import AvatarCropModal from '../../../components/avatar/AvatarCropModal'

export default function CustomerProfilePage() {
  const {
    profile,
    loading,
    saving,
    uploadingAvatar,
    isEditing,
    formData,
    errors,
    setIsEditing,
    handleInputChange,
    handleSave,
    handleCancel,
    handleAvatarChange,
    handleAvatarRemove,
  } = useCustomerProfile()

  const [avatarError, setAvatarError] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const resolvedAvatar = resolveAvatarUrl(profile?.avatar)

  useEffect(() => {
    setAvatarError(false)
  }, [profile?.avatar])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Please choose a valid JPG, PNG, or WEBP image.')
        e.target.value = ''
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Photo size must be less than 5MB.')
        e.target.value = ''
        return
      }
      setCropFile(file)
      setIsCropOpen(true)
    }
    e.target.value = ''
  }

  const handleCropSave = async (croppedFile: File) => {
    const success = await handleAvatarChange(croppedFile)
    if (success) {
      setIsCropOpen(false)
      setCropFile(null)
    } else {
      throw new Error('Failed to update profile picture. Please try again.')
    }
  }

  const handleCropClose = () => {
    if (!uploadingAvatar) {
      setIsCropOpen(false)
      setCropFile(null)
    }
  }

  if (loading) {
    return (
      <div className="ew-page tab-content active" role="tabpanel" aria-label="Customer Profile Loading">
        <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="card-glass" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '200px', height: '22px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                <div style={{ width: '140px', height: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="ew-page tab-content active" role="tabpanel" aria-label="Customer Profile Error">
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          <div className="card-base" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Unable to load customer profile details.</p>
          </div>
        </div>
      </div>
    )
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'CU'

  return (
    <div className="ew-page tab-content active" role="tabpanel" aria-label="Customer Account Profile" id="tab-customer-profile">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

        {/* Unified Profile Identity Header */}
        <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                {resolvedAvatar && !avatarError ? (
                  <img
                    src={resolvedAvatar}
                    alt={profile.name}
                    onError={() => setAvatarError(true)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 24px rgba(23, 168, 229, 0.3)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-blue) 0%, rgba(23, 168, 229, 0.45) 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      fontWeight: 800,
                      fontFamily: "'Outfit', sans-serif",
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 8px 24px rgba(23, 168, 229, 0.3)',
                    }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                )}
                {uploadingAvatar && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.65)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    ...
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                    {profile.name}
                  </h1>
                  <span className="badge badge-success badge-sm">KYC Verified</span>
                  <span className="badge badge-neutral badge-sm" style={{ textTransform: 'capitalize' }}>
                    {profile.accountType} Consumer
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                  {profile.email}{profile.phone ? ` · +91 ${profile.phone}` : ''} · Member since {profile.joinedDateFormatted}
                </p>

                {/* Profile Photo Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="customer-profile-photo-input"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    aria-label="Upload profile picture"
                    onChange={onFileSelected}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      color: 'var(--color-cyan)',
                      border: '1px solid rgba(23, 168, 229, 0.3)',
                      borderRadius: '6px',
                    }}
                    aria-label={profile.avatar ? 'Change profile photo' : 'Add profile photo'}
                  >
                    {uploadingAvatar ? 'Uploading...' : profile.avatar ? '📷 Change Photo' : '📷 Add Photo'}
                  </button>
                  {profile.avatar && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar}
                      style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--text-muted)' }}
                      aria-label="Remove profile photo"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditing ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
                  style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 600 }}
                >
                  ✏ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ fontSize: '12px', padding: '7px 16px', fontWeight: 600 }}
                  >
                    {saving ? 'Saving...' : '✓ Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleCancel}
                    disabled={saving}
                    style={{ fontSize: '12px', padding: '7px 14px' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>

          {/* Card 1: Personal & Contact Information */}
          <div className="card-base" style={{ padding: 'var(--space-5)' }}>
            <div className="ew-divider-head" style={{ marginBottom: 'var(--space-4)' }}>
              <h2 className="ew-divider-title" style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>
                Personal &amp; Contact Details
              </h2>
              <span className="ew-divider-sub">Primary homeowner details for site assessment &amp; billing</span>
            </div>

            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      Full Name
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {profile.name || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      Mobile Phone
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: profile.phone ? 'var(--color-blue)' : 'var(--text-muted)' }}>
                      {profile.phone ? `+91 ${profile.phone}` : 'Not provided'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    Email Address
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {profile.email || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      City / Region
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {profile.city || <span style={{ color: 'var(--text-muted)' }}>Not provided</span>}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      Account ID
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {profile.id ? profile.id : 'Not assigned'}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    Installation &amp; Residential Address
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: profile.address ? 'var(--text-secondary)' : 'var(--text-muted)', lineHeight: 1.5 }}>
                    {profile.address || 'Not provided'}
                  </span>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="customer-profile-name" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Full Name *</label>
                    <input
                      id="customer-profile-name"
                      type="text"
                      className="form-input"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: `1px solid ${errors.name ? 'var(--color-red)' : 'var(--border-color)'}`, color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    {errors.name && <span style={{ fontSize: '10px', color: 'var(--color-red)' }}>{errors.name}</span>}
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="customer-profile-phone" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Mobile Phone *</label>
                    <input
                      id="customer-profile-phone"
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: `1px solid ${errors.phone ? 'var(--color-red)' : 'var(--border-color)'}`, color: 'var(--text-primary)', fontSize: '12px' }}
                    />
                    {errors.phone && <span style={{ fontSize: '10px', color: 'var(--color-red)' }}>{errors.phone}</span>}
                  </div>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="customer-profile-city" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>City / Region *</label>
                  <input
                    id="customer-profile-city"
                    type="text"
                    className="form-input"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: `1px solid ${errors.city ? 'var(--color-red)' : 'var(--border-color)'}`, color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                  {errors.city && <span style={{ fontSize: '10px', color: 'var(--color-red)' }}>{errors.city}</span>}
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="customer-profile-address" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Installation Address *</label>
                  <input
                    id="customer-profile-address"
                    type="text"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: `1px solid ${errors.address ? 'var(--color-red)' : 'var(--border-color)'}`, color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                  {errors.address && <span style={{ fontSize: '10px', color: 'var(--color-red)' }}>{errors.address}</span>}
                </div>
              </form>
            )}
          </div>

          {/* Card 2: Utility & Solar Interconnection */}
          <div className="card-base" style={{ padding: 'var(--space-5)' }}>
            <div className="ew-divider-head" style={{ marginBottom: 'var(--space-4)' }}>
              <h2 className="ew-divider-title" style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>
                Utility &amp; Grid Linkage
              </h2>
              <span className="ew-divider-sub">DISCOM interconnection &amp; net metering</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  DISCOM Provider
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: profile.discom ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {profile.discom ?? 'Not linked yet'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    Consumer Account (K-No)
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: profile.consumerNumber ? 'var(--color-cyan)' : 'var(--text-muted)' }}>
                    {profile.consumerNumber ?? 'Not linked yet'}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    Sanctioned Grid Load
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: profile.sanctionedLoadKw ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {profile.sanctionedLoadKw
                      ? (profile.sanctionedLoadKw.toLowerCase().includes('kw') ? profile.sanctionedLoadKw : `${profile.sanctionedLoadKw} kW`)
                      : 'Not linked yet'}
                  </span>
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(23, 168, 229, 0.08)', border: '1px solid rgba(23, 168, 229, 0.25)', marginTop: 'var(--space-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-blue)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    Net Metering
                  </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'block' }}>
                  Bi-directional metering lets exported solar units offset your grid bill as per your DISCOM policy.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <AvatarCropModal
        isOpen={isCropOpen}
        imageFile={cropFile}
        onClose={handleCropClose}
        onSave={handleCropSave}
        isSaving={uploadingAvatar}
      />
    </div>
  </div>
  )
}
