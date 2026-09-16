import React, { useState } from 'react'
import type { CanonicalTechnicianProfile } from '../types/profile.types'
import { MdVerified, MdLocationOn, MdEdit, MdCheckCircle } from 'react-icons/md'

interface ProfileHeroProps {
  profile: CanonicalTechnicianProfile
  onUpdateProfile: (update: { name?: string; phone?: string; city?: string }) => void
  isUpdating?: boolean
}

export default function ProfileHero({ profile, onUpdateProfile, isUpdating }: ProfileHeroProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name)
  const [phoneInput, setPhoneInput] = useState(profile.phone)
  const [cityInput, setCityInput] = useState(profile.city)

  const handleSave = () => {
    onUpdateProfile({ name: nameInput, phone: phoneInput, city: cityInput })
    setIsEditing(false)
  }

  return (
    <div className="profile-hero">
      <div className="profile-hero-header">
        <div className="profile-avatar-group">
          <div className="profile-avatar-circle">{profile.initials || 'ST'}</div>
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
    </div>
  )
}
