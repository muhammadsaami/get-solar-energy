import React from 'react'
import { MdPerson, MdTimeline, MdVerified, MdLocationOn } from 'react-icons/md'

interface ProfileTabsProps {
  activeTab: 'overview' | 'performance' | 'skills' | 'regions'
  onTabChange: (tab: 'overview' | 'performance' | 'skills' | 'regions') => void
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="profile-tabs">
      <button
        className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
        onClick={() => onTabChange('overview')}
      >
        <MdPerson /> Profile Overview
      </button>
      <button
        className={`profile-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
        onClick={() => onTabChange('performance')}
      >
        <MdTimeline /> Performance Metrics
      </button>
      <button
        className={`profile-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
        onClick={() => onTabChange('skills')}
      >
        <MdVerified /> Skills & Badges
      </button>
      <button
        className={`profile-tab-btn ${activeTab === 'regions' ? 'active' : ''}`}
        onClick={() => onTabChange('regions')}
      >
        <MdLocationOn /> Service Regions
      </button>
    </div>
  )
}
