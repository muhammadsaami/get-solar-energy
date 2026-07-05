import React from 'react';
import { usePlanning } from '../../contexts/PlanningContext';
import { MdDeleteOutline, MdDescription } from 'react-icons/md';

export default function BillCard({ bill }) {
  const { deleteBill } = usePlanning();

  const formattedDate = new Date(bill.uploadDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="glass-card" style={{
      padding: '20px',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      background: 'rgba(8, 24, 42, 0.72)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '15px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          width: '45px',
          height: '45px',
          borderRadius: '8px',
          background: 'rgba(23,168,229,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-blue)',
          fontSize: '22px'
        }}>
          <MdDescription />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>
              {bill.billingPeriod} Bill
            </h4>
            <span style={{
              background: 'rgba(54, 211, 153, 0.1)',
              border: '1px solid rgba(54, 211, 153, 0.2)',
              color: '#36d399',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase'
            }}>
              {bill.verificationStatus}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Uploaded: {formattedDate} • Sanctioned Load: {bill.sanctionedLoad} kW
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Consumption</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>
            {bill.kwhConsumption} kWh
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Amount</div>
          <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-blue)', marginTop: '2px' }}>
            ₹{bill.amount.toLocaleString('en-IN')}
          </div>
        </div>

        <button
          onClick={() => deleteBill(bill.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f43f5e',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
          title="Delete Bill"
        >
          <MdDeleteOutline />
        </button>
      </div>
    </div>
  );
}
