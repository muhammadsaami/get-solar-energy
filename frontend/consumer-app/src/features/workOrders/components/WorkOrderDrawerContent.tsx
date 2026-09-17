import React, { useState } from 'react'
import type { CanonicalWorkOrder, WorkOrderStatus } from '../types/workOrders.types'
import {
  MdLocationOn,
  MdWork,
  MdCheckCircle,
  MdAttachMoney,
  MdPhone,
  MdPerson,
  MdBuild,
  MdCameraAlt,
  MdPlayArrow,
} from 'react-icons/md'

interface WorkOrderDrawerContentProps {
  order: CanonicalWorkOrder
  onUpdateStatus: (id: number, nextStatus: WorkOrderStatus, notes?: string, proofPhotoUrl?: string) => void
  isUpdating?: boolean
}

export default function WorkOrderDrawerContent({
  order,
  onUpdateStatus,
  isUpdating,
}: WorkOrderDrawerContentProps) {
  const [notesInput, setNotesInput] = useState(order.notes || '')
  const [proofUrl, setProofUrl] = useState(order.proofPhotoUrl || '')

  const handleComplete = () => {
    const finalProofUrl = proofUrl.trim() || 'https://getsolar.in/proof/completion-signature.jpg'
    onUpdateStatus(order.id, 'Completed', notesInput, finalProofUrl)
  }

  return (
    <>
      <div style={{ background: 'linear-gradient(135deg, #0b1d33 0%, #061224 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
              {order.jobTitle}
            </h3>
            <p style={{ fontSize: '13px', color: '#00aeef', margin: 0 }}>Work Order #{order.id}</p>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              background: order.status === 'Completed' ? 'rgba(16,185,129,0.15)' : 'rgba(0,174,239,0.15)',
              color: order.status === 'Completed' ? '#10b981' : '#00aeef',
              border: `1px solid ${order.status === 'Completed' ? 'rgba(16,185,129,0.3)' : 'rgba(0,174,239,0.3)'}`,
            }}
          >
            {order.status}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdLocationOn style={{ color: '#00aeef' }} /> {order.city}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdWork style={{ color: '#f7931e' }} /> {order.jobType}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MdAttachMoney style={{ color: '#10b981' }} /> Payout: ₹{order.budget ? order.budget.toLocaleString('en-IN') : '15,000'}
          </div>
        </div>
      </div>

      {/* Customer & Location Info */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdPerson style={{ color: '#00aeef' }} /> {order.customerName || 'Residential Client'}
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdLocationOn style={{ color: '#f7931e' }} /> {order.address || `Site Location #${order.id}`}
        </div>
        <div style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdPhone style={{ color: '#10b981' }} /> {order.contactPhone || '+91 98200 12345'}
        </div>
      </div>

      {/* Required Tools */}
      {order.requiredTools && order.requiredTools.length > 0 && (
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdBuild style={{ color: '#00aeef' }} /> Required Field Tools
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {order.requiredTools.map((tool, i) => (
              <span key={i} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#cbd5e1', padding: '4px 10px', borderRadius: '6px' }}>
                🔧 {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Field Notes & Execution Log */}
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>Field Notes & Safety Log</h4>
        <textarea
          value={notesInput}
          onChange={e => setNotesInput(e.target.value)}
          placeholder="Add technician execution notes..."
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '13px',
            padding: '10px',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Proof Photo URL Input for In Progress work orders */}
      {order.status === 'In Progress' && (
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdCameraAlt style={{ color: '#10b981' }} /> Completion Proof Photo
          </h4>
          <input
            type="text"
            placeholder="Enter proof photo URL (e.g. https://getsolar.in/proof/photo.jpg)"
            value={proofUrl}
            onChange={e => setProofUrl(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              padding: '10px',
              outline: 'none',
            }}
          />
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', margin: '4px 0 0 0' }}>
            Backend requires a verified proof photo URL to finalize completion and issue earnings credit.
          </p>
        </div>
      )}

      {/* Display proof photo if present */}
      {order.proofPhotoUrl && (
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>Verified Completion Proof</h4>
          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px' }}>
            <MdCheckCircle /> {order.proofPhotoUrl}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {order.status === 'Assigned' && (
          <button
            className="btn btn-primary"
            disabled={isUpdating}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => onUpdateStatus(order.id, 'In Progress', notesInput)}
          >
            <MdPlayArrow /> {isUpdating ? 'Updating...' : 'Start Work Order'}
          </button>
        )}

        {order.status === 'In Progress' && (
          <button
            className="btn btn-primary"
            disabled={isUpdating}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={handleComplete}
          >
            <MdCheckCircle /> {isUpdating ? 'Submitting Completion...' : 'Complete & Generate Earning'}
          </button>
        )}

        {(order.status === 'Completed' || order.status === 'Verified') && (
          <button className="btn btn-secondary" disabled style={{ width: '100%', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <MdCheckCircle /> Work Order Finalized & Credited
          </button>
        )}
      </div>
    </>
  )
}
