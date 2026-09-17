import React from 'react'
import { MdSmartToy, MdRefresh, MdVerifiedUser } from 'react-icons/md'

interface TechnicianAiHeroProps {
  onClearHistory: () => void
}

export default function TechnicianAiHero({ onClearHistory }: TechnicianAiHeroProps) {
  return (
    <div className="ai-hero">
      <div className="ai-hero-header">
        <div className="ai-hero-title-group">
          <h1>
            <MdSmartToy style={{ color: '#00aeef' }} /> AI Field Assistant & Diagnostics
          </h1>
          <p>
            Real-time step-by-step troubleshooting for Inverter faults, DISCOM grid trips, thermal hotspots, and rooftop earthing resistance issues.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          aria-label="Clear AI conversation history"
          title="Clear AI conversation history"
          onClick={onClearHistory}
        >
          <MdRefresh /> Clear Conversation
        </button>
      </div>

      <div className="ai-hero-meta">
        <div className="ai-hero-meta-item">
          <MdVerifiedUser style={{ color: '#10b981' }} /> Model Context: <strong style={{ color: '#ffffff' }}>GET Solar Energy Engine v2.4</strong>
        </div>
        <div className="ai-hero-meta-item">
          Safety Protocol: <strong style={{ color: '#ffffff' }}>LOTO 1000V DC Active Safeguards</strong>
        </div>
      </div>
    </div>
  )
}
