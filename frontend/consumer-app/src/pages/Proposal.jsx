import React from 'react';
import { usePlanning } from '../contexts/PlanningContext';
import ProposalCard from '../components/planning/ProposalCard';

export default function Proposal() {
  const { proposal, loading } = usePlanning();

  if (loading) return <div>Loading Sizing Proposal...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '950px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          Engineering Proposal
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          Review your recommended system parameters, component metrics, and payback schedule.
        </p>
      </div>

      {proposal ? (
        <ProposalCard proposal={proposal} />
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
          Proposal calculation pending. Verify roof assessment details first.
        </div>
      )}
    </div>
  );
}
