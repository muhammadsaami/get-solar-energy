import React from 'react';
import { usePlanning } from '../contexts/PlanningContext';
import BillUploader from '../components/planning/BillUploader';
import BillCard from '../components/planning/BillCard';
import BillStatusTimeline from '../components/planning/BillStatusTimeline';

export default function Bills() {
  const { bills, activeBillOcr, ocrLoading, error } = usePlanning();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          Electricity Bills
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          Manage your uploaded utility invoices and review verified tariff metrics.
        </p>
      </div>

      {error && (
        <div style={{ padding: '15px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: '8px', fontSize: '14px', fontWeight: '700' }}>
          {error}
        </div>
      )}

      {/* Bill Upload Section */}
      <BillUploader />

      {/* active bill status timeline */}
      {ocrLoading ? (
        <div className="glass-card" style={{ padding: '30px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Analyzing bill details with GenAI...
          </div>
        </div>
      ) : activeBillOcr ? (
        <BillStatusTimeline activeBill={activeBillOcr} />
      ) : null}

      {/* History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '850', margin: '10px 0 0 0' }}>Bill Upload History</h3>
        {bills.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#475569', border: '1px solid rgba(255,255,255,0.05)' }}>
            No utility bills uploaded yet.
          </div>
        ) : (
          bills.map(bill => (
            <BillCard key={bill.id} bill={bill} />
          ))
        )}
      </div>

    </div>
  );
}
