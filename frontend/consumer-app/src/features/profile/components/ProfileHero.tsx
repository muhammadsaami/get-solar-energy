import React, { useState, useEffect } from 'react'
import type { CanonicalTechnicianProfile } from '../types/profile.types'
import { MdVerified, MdLocationOn, MdEdit, MdCheckCircle } from 'react-icons/md'
import { profileService } from '../services/profile.service'
import { resolveAvatarUrl } from '../../../utils/avatar'
import AvatarCropModal from '../../../components/avatar/AvatarCropModal'

interface ProfileHeroProps {
  profile: CanonicalTechnicianProfile
  onUpdateProfile: (update: { name?: string; phone?: string; city?: string; avatar?: string }) => void
  isUpdating?: boolean
}

export default function ProfileHero({ profile, onUpdateProfile, isUpdating }: ProfileHeroProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name)
  const [phoneInput, setPhoneInput] = useState(profile.phone)
  const [cityInput, setCityInput] = useState(profile.city)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)

  const resolvedAvatar = resolveAvatarUrl(profile?.avatar)

  useEffect(() => {
    setAvatarError(false)
  }, [profile?.avatar])

  const handleSave = () => {
    onUpdateProfile({ name: nameInput, phone: phoneInput, city: cityInput })
    setIsEditing(false)
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please select a JPG, PNG, or WEBP image.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB.')
      e.target.value = ''
      return
    }
    setCropFile(file)
    setIsCropOpen(true)
    e.target.value = ''
  }

  const handleCropSave = async (croppedFile: File) => {
    try {
      setUploadingPhoto(true)
      const url = await profileService.uploadAvatar(croppedFile)
      if (url) {
        onUpdateProfile({ avatar: url })
        setIsCropOpen(false)
        setCropFile(null)
      } else {
        throw new Error('Upload did not return an avatar URL.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload profile photo.'
      alert(msg)
      throw err
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCropClose = () => {
    if (!uploadingPhoto) {
      setIsCropOpen(false)
      setCropFile(null)
    }
  }

  const handlePhotoRemove = () => {
    onUpdateProfile({ avatar: '' })
  }

  return (
    <div className="profile-hero">
      <div className="profile-hero-header">
        <div className="profile-avatar-group">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div className="profile-avatar-circle" style={{ overflow: 'hidden' }}>
              {resolvedAvatar && !avatarError ? (
                <img
                  src={resolvedAvatar}
                  alt={profile.name}
                  onError={() => setAvatarError(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                profile.initials || 'ST'
              )}
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <label
                htmlFor="technicianAvatarUpload"
                className="btn btn-secondary"
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  cursor: uploadingPhoto ? 'wait' : 'pointer',
                  borderRadius: '4px',
                  margin: 0,
                  lineHeight: '1.2',
                }}
              >
                {uploadingPhoto ? '...' : profile.avatar ? 'Change' : 'Add Photo'}
              </label>
              <input
                id="technicianAvatarUpload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                disabled={uploadingPhoto}
                onChange={handlePhotoSelect}
              />
              {profile.avatar && (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: '#f87171',
                    lineHeight: '1.2',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="profile-hero-title-group">
            <h1>
              {profile.name} <MdVerified style={{ color: 'var(--color-cyan)', fontSize: '22px' }} />
            </h1>
            <p>
              {profile.skillLevel} Field Technician • Member since {profile.joinedDateFormatted}
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setIsEditing(!isEditing)}
          aria-label={isEditing ? 'Cancel editing profile' : 'Edit profile details'}
        >
          <MdEdit /> {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <div className="profile-edit-box">
          <div className="profile-edit-grid">
            <div className="profile-edit-field">
              <label htmlFor="editName">Full Name</label>
              <input
                id="editName"
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
              />
            </div>
            <div className="profile-edit-field">
              <label htmlFor="editPhone">Phone Number</label>
              <input
                id="editPhone"
                type="text"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
              />
            </div>
            <div className="profile-edit-field">
              <label htmlFor="editCity">Primary City</label>
              <input
                id="editCity"
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
              />
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={isUpdating}
            style={{ alignSelf: 'flex-end' }}
          >
            <MdCheckCircle /> {isUpdating ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      ) : (
        <div className="profile-meta-bar">
          <div className="profile-meta-item">
            <MdLocationOn style={{ color: 'var(--color-cyan)' }} /> Primary City: <strong style={{ color: 'var(--text-primary)' }}>{profile.city}</strong>
          </div>
          <div className="profile-meta-item">
            <MdVerified style={{ color: 'var(--color-green)' }} /> Identity KYC: <strong style={{ color: 'var(--text-primary)' }}>{profile.kycStatus}</strong>
          </div>
          <div className="profile-meta-item">
            Profile Completeness: <strong style={{ color: 'var(--color-green)' }}>{profile.completenessPercent}%</strong>
          </div>
        </div>
      )}

      <AvatarCropModal
        isOpen={isCropOpen}
        imageFile={cropFile}
        onClose={handleCropClose}
        onSave={handleCropSave}
        isSaving={uploadingPhoto}
      />
    </div>
  )
}
