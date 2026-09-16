import React from 'react'
import type { CanonicalEarning } from '../types/earnings.types'
import {
  MdCheckCircle,
  MdReceipt,
  MdAccountBalance,
  MdWork,
  MdAccessTime,
  MdDownload,
} from 'react-icons/md'
import { useNotificationStore } from '../../../stores/notificationStore'

interface PayoutDrawerContentProps {
  earning: CanonicalEarning
}

export default function PayoutDrawerContent({ earning }: PayoutDrawerContentProps) {
  const addToast = useNotificationStore((s) => s.addToast)
  return (
    <>
      <div style={{ background: 'linear-gradient(135deg, #0b221a 0%, #061712 100%)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
              {earning.workOrderTitle}
            </h3>
            <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>Payout Transaction #{earning.id}</p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: earning.payoutStatus === 'Paid' ? 'rgba(16,185,129,0.15)' : 'rgba(247,147,30,0.15)',
              color: earning.payoutStatus === 'Paid' ? '#10b981' : '#f7931e',
              border: `1px solid ${earning.payoutStatus === 'Paid' ? 'rgba(16,185,129,0.3)' : 'rgba(247,147,30,0.3)'}`,
            }}
          >
            {earning.payoutStatus}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdWork style={{ color: '#00aeef' }} /> {earning.jobType}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdAccessTime style={{ color: '#94a3b8' }} /> {earning.createdTimeAgo}
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Base Work Order Budget</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>₹{earning.amount.toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Platform Dispatch Fee</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>₹0 (100% Guaranteed)</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Net Technician Credit</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
            ₹{earning.amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Transaction & Settlement Details */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdReceipt style={{ color: '#f7931e' }} /> UTR Reference: <strong style={{ color: '#ffffff' }}>{earning.transactionRef}</strong>
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdAccountBalance style={{ color: '#00aeef' }} /> Settlement: <strong style={{ color: '#ffffff' }}>{earning.paymentMethod}</strong>
        </div>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdCheckCircle style={{ color: '#10b981' }} /> Associated Work Order: <strong style={{ color: '#ffffff' }}>WO #{earning.workOrderId}</strong>
        </div>
      </div>

      {/* Download Slip Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          onClick={() => addToast({ type: 'info', message: `Downloading payment voucher for ${earning.transactionRef}` })}
        >
          <MdDownload /> Download Payment Slip (PDF)
        </button>
      </div>
    </>
  )
}
