import React, { useState, useCallback } from 'react'
import { copyReferralCode, copyReferralLink, shareOnWhatsApp } from '../../utils/referral'

interface Props {
  referralCode: string
  onApplyCode: (code: string) => Promise<string | null>
}

export default function ReferralSharingCard({ referralCode, onApplyCode }: Props) {
  const [applyInput, setApplyInput] = useState('')
  const [applying, setApplying] = useState(false)
  const [applyMsg, setApplyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedWhat, setCopiedWhat] = useState<'code' | 'link' | null>(null)

  const referralLink = `https://getsolar.energy/signup?ref=${referralCode}`

  const handleCopyCode = useCallback(async () => {
    const ok = await copyReferralCode(referralCode)
    if (ok) {
      setCopiedWhat('code')
      setTimeout(() => setCopiedWhat(null), 2000)
    }
  }, [referralCode])

  const handleCopyLink = useCallback(async () => {
    const ok = await copyReferralLink(referralCode)
    if (ok) {
      setCopiedWhat('link')
      setTimeout(() => setCopiedWhat(null), 2000)
    }
  }, [referralCode])

  const handleWhatsApp = useCallback(() => {
    shareOnWhatsApp(referralCode)
  }, [referralCode])

  const handleApply = useCallback(async () => {
    const code = applyInput.trim().toUpperCase()
    if (!code) return
    setApplying(true)
    setApplyMsg(null)
    const err = await onApplyCode(code)
    if (err) {
      setApplyMsg({ type: 'error', text: err })
    } else {
      setApplyMsg({ type: 'success', text: 'Referral code applied successfully!' })
      setApplyInput('')
    }
    setApplying(false)
  }, [applyInput, onApplyCode])

  return (
    <div className="card-base" style={{ '--card-theme': '54, 211, 153', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as React.CSSProperties}>
      <div>
        <div className="kpi-header-row">
          <span className="kpi-title">Your Referral Code</span>
        </div>
        <div style={{ marginTop: '15px', textAlign: 'center', padding: '20px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--accent-green)', letterSpacing: '2px', display: 'block' }}>
            {referralCode || '\u2014'}
          </span>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '10px 0 4px 0' }}>Referral Link</p>
          <div style={{ fontSize: '10px', color: 'var(--accent-blue)', wordBreak: 'break-all', background: 'rgba(0,174,239,0.06)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(0,174,239,0.15)', marginBottom: '14px' }}>
            {referralLink}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="calc-btn"
              onClick={handleCopyCode}
              style={{ margin: 0, padding: '8px 14px', fontSize: '11px', height: 'auto', width: 'auto' }}
              aria-label="Copy referral code"
            >
              {copiedWhat === 'code' ? 'Copied!' : 'Copy Code'}
            </button>
            <button
              className="calc-btn"
              onClick={handleCopyLink}
              style={{ margin: 0, padding: '8px 14px', fontSize: '11px', height: 'auto', width: 'auto', background: 'transparent', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
              aria-label="Copy referral link"
            >
              {copiedWhat === 'link' ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              className="calc-btn"
              onClick={handleWhatsApp}
              style={{ margin: 0, padding: '8px 14px', fontSize: '11px', height: 'auto', width: 'auto', background: '#25d366', borderColor: '#25d366', color: '#fff' }}
              aria-label="Share on WhatsApp"
            >
              WhatsApp
            </button>
          </div>
          <div style={{ marginTop: '15px', borderTop: '1px solid var(--border-color-light)', paddingTop: '15px' }}>
            <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Apply Friend's Code</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={applyInput}
                onChange={e => setApplyInput(e.target.value.toUpperCase())}
                placeholder="e.g. ADM999"
                style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-navy)', fontSize: '11px', outline: 'none', textTransform: 'uppercase' }}
                aria-label="Enter a referral code to apply"
                onKeyDown={e => { if (e.key === 'Enter') handleApply() }}
              />
              <button
                className="calc-btn"
                onClick={handleApply}
                disabled={applying || !applyInput.trim()}
                style={{ margin: 0, padding: '6px 12px', fontSize: '11px', height: 'auto', width: 'auto' }}
                aria-label="Apply referral code"
              >
                {applying ? '...' : 'Apply'}
              </button>
            </div>
            {applyMsg && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: applyMsg.type === 'success' ? 'rgba(54,211,153,0.08)' : 'rgba(231,76,60,0.06)',
                  color: applyMsg.type === 'success' ? 'var(--accent-green)' : '#ef4444',
                }}
                role="alert"
                aria-live="polite"
              >
                {applyMsg.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
