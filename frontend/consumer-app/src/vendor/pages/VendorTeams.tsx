import React, { useState, useEffect, useCallback, useRef } from 'react'
import DashboardHeader from '../components/DashboardHeader'
import StatusBadge from '../components/StatusBadge'
import VendorEmptyState from '../components/VendorEmptyState'
import { useAuth } from '../../contexts/AuthContext'
import { useVendorNotify } from '../hooks/useVendorNotify'
import {
  getTeam,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../services/vendor.service'
import type { VendorTeamMember } from '../types/vendor.types'

export function VendorTeams() {
  const notify = useVendorNotify()
  const auth = useAuth() as unknown as { user?: { email?: string } }
  const vendorEmail = auth?.user?.email || 'vendor@getsolar.in'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<VendorTeamMember[]>([])
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState('Field Installation Engineer')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formCity, setFormCity] = useState('Jaipur')

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchTeam = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTeam(vendorEmail)
      if (!isMountedRef.current) return
      setMembers(Array.isArray(data?.members) ? data.members : [])
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const msg = err instanceof Error ? err.message : 'Failed to fetch team members from server'
      setError(msg)
      setMembers([])
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [vendorEmail])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      notify('Team member name is required')
      return
    }
    setSubmitting(true)
    try {
      await createTeamMember({
        vendor_email: vendorEmail,
        name: formName.trim(),
        role: formRole.trim(),
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        city: formCity.trim() || undefined,
      })
      notify(`Added ${formName.trim()} to field team`)
      setShowAddModal(false)
      setFormName('')
      setFormPhone('')
      setFormEmail('')
      await fetchTeam()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create team member'
      notify(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (member: VendorTeamMember) => {
    try {
      await updateTeamMember(member.id, { is_active: !member.is_active })
      notify(`Updated status for ${member.name}`)
      await fetchTeam()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update member status'
      notify(msg)
    }
  }

  const handleDelete = async (memberId: number, memberName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the roster?`)) return
    try {
      await deleteTeamMember(memberId)
      notify(`Removed ${memberName} from roster`)
      await fetchTeam()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete team member'
      notify(msg)
    }
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      !q ||
      (m.name || '').toLowerCase().includes(q) ||
      (m.role || '').toLowerCase().includes(q) ||
      (m.city || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      String(m.id).toLowerCase().includes(q)
    )
  })

  const badgeText = loading
    ? 'Loading Team...'
    : error
    ? '— Active Engineers'
    : `${members.length} Active Engineers`

  return (
    <div className="animate-fade-in">
      <DashboardHeader
        title="Field Teams & Engineers"
        subtitle="Manage certified field engineer teams, skill allocations, and daily dispatch roster."
        badgeText={badgeText}
        actions={
          <button
            className="vendor-btn-primary"
            id="addTeamMemberBtn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Team Member
          </button>
        }
      />

      <div
        className="vendor-glass-card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>
          Field Engineering Roster
        </span>
        <div style={{ width: '280px', minWidth: '220px' }}>
          <input
            type="text"
            className="vendor-input"
            id="teamSearchInput"
            placeholder="Search by name, role, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="vendor-glass-card" style={{ padding: 0, overflow: 'hidden', minHeight: '300px' }}>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div
              className="vendor-spinner"
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid rgba(23, 168, 229, 0.2)',
                borderTopColor: 'var(--vendor-primary)',
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ fontSize: '14px', color: 'var(--vendor-text-secondary)', fontWeight: 600 }}>
              Loading engineering roster from live database...
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--vendor-danger)',
                fontSize: '24px',
              }}
            >
              ⚠
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 6px' }}>
              Unable to load team members
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--vendor-text-secondary)', margin: '0 0 20px' }}>
              {error}
            </p>
            <button className="vendor-btn-primary" onClick={fetchTeam}>
              🔄 Retry Load
            </button>
          </div>
        ) : members.length === 0 ? (
          <VendorEmptyState
            title="No Field Engineers Registered"
            description="Add certified site engineers and installation technicians to assign them to rooftop solar projects."
            action={{ label: '+ Add Team Member', onClick: () => setShowAddModal(true) }}
          />
        ) : filtered.length === 0 ? (
          <VendorEmptyState
            title="No Matching Engineers"
            description="No field engineers match your current search query."
            action={{ label: 'Clear Search', onClick: () => setSearch('') }}
          />
        ) : (
          <table className="vendor-table-container">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Engineer Name</th>
                <th>Role / Specialization</th>
                <th>Contact Phone</th>
                <th>Email</th>
                <th>City / Region</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 800, color: 'var(--vendor-primary)' }}>
                    ENG-{String(m.id).padStart(4, '0')}
                  </td>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{m.name}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)', fontWeight: 500 }}>
                    {m.role || 'Field Engineer'}
                  </td>
                  <td style={{ color: 'var(--vendor-text-muted)' }}>{m.phone || '—'}</td>
                  <td style={{ color: 'var(--vendor-text-secondary)', fontSize: '12px' }}>
                    {m.email || '—'}
                  </td>
                  <td style={{ color: 'var(--vendor-text-secondary)' }}>{m.city || '—'}</td>
                  <td>
                    <StatusBadge status={m.is_active ? 'Active' : 'Inactive'} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="vendor-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                        onClick={() => handleToggleStatus(m)}
                      >
                        {m.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="vendor-btn-ghost"
                        style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--vendor-danger)' }}
                        onClick={() => handleDelete(m.id, m.name)}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 18, 0.78)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="vendor-glass-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: 'var(--font-family)' }}>
                Add Field Engineer
              </h3>
              <button
                className="vendor-btn-ghost"
                style={{ padding: '4px 8px', fontSize: '16px' }}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  className="vendor-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Role / Specialization
                </label>
                <select
                  className="vendor-input"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                >
                  <option value="Field Installation Engineer">Field Installation Engineer</option>
                  <option value="Solar Rooftop Technician">Solar Rooftop Technician</option>
                  <option value="Master Electrician / HT Specialist">Master Electrician / HT Specialist</option>
                  <option value="Quality & DISCOM Inspector">Quality & DISCOM Inspector</option>
                  <option value="Site Survey Supervisor">Site Survey Supervisor</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="vendor-input"
                    placeholder="9829012345"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                    City / Base Hub
                  </label>
                  <input
                    type="text"
                    className="vendor-input"
                    placeholder="Jaipur"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vendor-text-secondary)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="vendor-input"
                  placeholder="ramesh@getsolar.in"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="vendor-btn-ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vendor-btn-primary"
                  id="submitTeamMemberBtn"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Add Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorTeams
