import React, { useState } from 'react';
import { usePlanning } from '../../contexts/PlanningContext';
import { MdCheckCircle, MdPictureAsPdf, MdOutlineDescription } from 'react-icons/md';

export default function ProposalCard({ proposal }) {
  const { approveProposal, loading } = usePlanning();
  const [signed, setSigned] = useState(false);

  if (!proposal) return null;

  const handleApprove = async () => {
    const res = await approveProposal();
    if (res.success) {
      setSigned(true);
    }
  };

  const isApproved = proposal.status === 'Approved' || signed;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Header Sizing Overview */}
      <div className="glass-card" style={{
        padding: '30px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(8, 24, 42, 0.82) 0%, rgba(6, 15, 31, 0.92) 100%)',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '850', color: 'var(--color-orange)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              System Sizing Summary
            </span>
            <span style={{
              background: isApproved ? 'rgba(54, 211, 153, 0.1)' : 'rgba(255, 138, 29, 0.1)',
              border: isApproved ? '1px solid rgba(54, 211, 153, 0.2)' : '1px solid rgba(255, 138, 29, 0.2)',
              color: isApproved ? '#36d399' : 'var(--color-orange)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '800'
            }}>
              {isApproved ? 'Approved' : proposal.status}
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            Recommended Size: {proposal.systemSizeKw} kWp
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Estimated Annual Generation: <strong>{proposal.expectedGenerationYrHkwh.toLocaleString()} kWh / year</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text-primary)',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MdPictureAsPdf />
            Download PDF
          </button>

          {!isApproved && (
            <button
              onClick={handleApprove}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(255, 138, 29, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MdCheckCircle />
              {loading ? 'Approving...' : 'Approve Proposal'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Monthly Savings */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '750' }}>Monthly Savings</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-blue)', marginTop: '6px' }}>
            ₹{proposal.monthlySavings.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Annual Savings */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '750' }}>Annual Savings</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--color-blue)', marginTop: '6px' }}>
            ₹{proposal.annualSavings.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Subsidy Sizing */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '750' }}>Govt Subsidy</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#36d399', marginTop: '6px' }}>
            ₹{proposal.subsidyAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Payback timeline */}
        <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '750' }}>Payback Period</div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '6px' }}>
            {proposal.paybackYears} Years
          </div>
        </div>

      </div>

      {/* 3. Equipment Checklist */}
      <div className="glass-card" style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8, 24, 42, 0.72)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '850', marginBottom: '20px' }}>Proposed Component Hardware</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {proposal.equipment.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--color-blue)', fontSize: '18px', display: 'flex' }}><MdOutlineDescription /></span>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>{item.type}</span>
              </div>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                {item.spec} (Qty: {item.quantity})
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
