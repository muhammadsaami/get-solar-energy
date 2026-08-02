import React from 'react'
import { MdAssignment, MdLocationOn, MdCheckCircle, MdFlashOn } from 'react-icons/md'

interface WorkOrdersHeroProps {
  onStartNextClick: () => void
}

export default function WorkOrdersHero({ onStartNextClick }: WorkOrdersHeroProps) {
  return (
    <div className="wo-hero">
      <div className="wo-hero-header">
        <div className="wo-hero-title-group">
          <h1>
            <MdAssignment style={{ color: '#00aeef' }} /> Technician Work Orders
          </h1>
          <p>
            Track your assigned solar installation, AMC audit, high-voltage repair, and DISCOM inspection jobs in real time.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={onStartNextClick}
        >
          <MdFlashOn /> Active Work Order
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdLocationOn style={{ color: '#00aeef' }} /> Service Region: <strong style={{ color: '#ffffff' }}>Mumbai & Suburban</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdCheckCircle style={{ color: '#10b981' }} /> Dispatch Status: <strong style={{ color: '#ffffff' }}>Active Technician</strong>
        </div>
      </div>
    </div>
  )
}
