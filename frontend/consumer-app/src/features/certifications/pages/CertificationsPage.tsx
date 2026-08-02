import React from 'react'
import { useCertifications } from '../hooks/useCertifications'
import CertificationsHero from '../components/CertificationsHero'
import ActiveCertificationsGrid from '../components/ActiveCertificationsGrid'
import SkillMatrixGrid from '../components/SkillMatrixGrid'
import CertificationTimeline from '../components/CertificationTimeline'
import CertificateDrawer from '../components/CertificateDrawer'
import CertificateDrawerContent from '../components/CertificateDrawerContent'
import CertificationsSkeleton from '../components/CertificationsSkeleton'
import CertificationsEmptyState from '../components/CertificationsEmptyState'
import { CERTIFICATION_CATEGORIES } from '../constants/certifications.constants'
import type { CertificationCategory } from '../types/certifications.types'
import { MdSearch, MdFilterList, MdRefresh } from 'react-icons/md'
import '../styles/certifications.css'

export default function CertificationsPage() {
  const {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedCertification,
    isDrawerOpen,
    closeDrawer,
    openDrawer,
    filteredCertifications,
    handleDownload,
    handleShare,
    reload,
  } = useCertifications()

  if (loading) {
    return <CertificationsSkeleton />
  }

  if (error) {
    return (
      <div className="certifications-container">
        <div
          className="auth-error-banner visible"
          role="alert"
          style={{
            margin: '40px auto',
            maxWidth: '600px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#f87171',
          }}
        >
          <span style={{ fontSize: '14px' }}>⚠️ {error}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={reload}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <MdRefresh /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.all.length === 0) {
    return <CertificationsEmptyState />
  }

  return (
    <div className="certifications-container">
      <CertificationsHero summary={data.summary} />

      <div className="cert-toolbar">
        <div className="cert-tabs">
          <button
            className={`cert-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard ({data.all.length})
          </button>
          <button
            className={`cert-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active ({data.active.length})
          </button>
          <button
            className={`cert-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({data.completed.length})
          </button>
          <button
            className={`cert-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`cert-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skill Matrix ({data.skills.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="cert-search-box">
            <MdSearch style={{ color: '#94a3b8', fontSize: '18px' }} />
            <input
              type="text"
              placeholder="Search certs, badges, skills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdFilterList style={{ color: '#94a3b8' }} />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as CertificationCategory | 'All')}
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '13px',
                borderRadius: '8px',
                padding: '6px 12px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="All">All Categories</option>
              {CERTIFICATION_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'skills' ? (
        <SkillMatrixGrid skills={data.skills} />
      ) : activeTab === 'timeline' ? (
        <CertificationTimeline
          timeline={data.timeline}
          onSelect={cert => openDrawer(cert, 'detail')}
        />
      ) : (
        <ActiveCertificationsGrid
          certifications={filteredCertifications}
          onSelect={cert => openDrawer(cert, 'detail')}
          onDownload={handleDownload}
          onShare={handleShare}
        />
      )}

      {/* Reusable Certificate Drawer */}
      <CertificateDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedCertification ? selectedCertification.badgeName : 'Credential Details'}
      >
        {selectedCertification && (
          <CertificateDrawerContent
            certification={selectedCertification}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        )}
      </CertificateDrawer>
    </div>
  )
}
