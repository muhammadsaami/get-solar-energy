import React from 'react'
import { useProfile } from '../hooks/useProfile'
import ProfileHero from '../components/ProfileHero'
import ProfileKPIs from '../components/ProfileKPIs'
import ProfileTabs from '../components/ProfileTabs'
import OverviewTab from '../components/OverviewTab'
import PerformanceMetricsTab from '../components/PerformanceMetricsTab'
import SkillsCertificationsTab from '../components/SkillsCertificationsTab'
import ServiceRegionsTab from '../components/ServiceRegionsTab'
import ProfileDrawer from '../components/ProfileDrawer'
import ProfileDrawerContent from '../components/ProfileDrawerContent'
import ProfileSkeleton from '../components/ProfileSkeleton'
import ProfileEmptyState from '../components/ProfileEmptyState'
import '../styles/profile.css'

export default function ProfilePage() {
  const {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    selectedBadge,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    handleUpdateProfile,
    isUpdating,
    reload,
  } = useProfile()

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error) {
    return <ProfileEmptyState error={error} onRetry={reload} />
  }

  if (!data || !data.profile) {
    return <ProfileEmptyState onRetry={reload} />
  }

  const { profile } = data

  return (
    <div className="profile-container">
      <ProfileHero
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        isUpdating={isUpdating}
      />

      <ProfileKPIs metrics={profile.metrics} />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Panels */}
      {activeTab === 'overview' ? (
        <OverviewTab profile={profile} onSelectBadge={openDrawer} />
      ) : activeTab === 'performance' ? (
        <PerformanceMetricsTab metrics={profile.metrics} />
      ) : activeTab === 'skills' ? (
        <SkillsCertificationsTab profile={profile} />
      ) : (
        <ServiceRegionsTab profile={profile} />
      )}

      {/* Reusable Achievement Badge Drawer */}
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        title={selectedBadge ? selectedBadge.title : 'Achievement Badge Details'}
      >
        {selectedBadge && <ProfileDrawerContent badge={selectedBadge} />}
      </ProfileDrawer>
    </div>
  )
}
