import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { getUser, copyReferralCode, copyReferralLink } from '../../utils/referral';
import { fetchAnalytics } from '../../services/reward.service';
import { useNotificationStore } from '../../stores/notificationStore';
import type { CustomerDashboardData } from '../../hooks/useCustomerDashboard';

interface Props {
  data?: CustomerDashboardData;
}

interface ReferralSummary {
  totalReferrals: number;
  totalPoints: number;
}

const REFERRAL_STEPS = [
  { label: 'Refer', hint: 'Use your referral code' },
  { label: 'Share', hint: 'Share your referral link' },
  { label: 'Verified Installation', hint: 'Eligible installation is verified' },
  { label: 'Reward', hint: 'Receive applicable rewards' },
];

export default function FooterGrid({ data }: Props) {
  const navigate = useNavigate();
  const addToast = useNotificationStore((s) => s.addToast);
  const user = getUser();
  const code = user?.referral_code || '';
  const email = user?.email || '';

  // Real referral summary — fetched once per customer email.
  // Any failure falls back to the static explanatory flow below; the
  // dashboard never shows an error for analytics alone.
  const [summary, setSummary] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    fetchAnalytics(email)
      .then((res) => {
        if (cancelled) return;
        const totals = res?.summary;
        if (
          res?.success !== false &&
          totals &&
          typeof totals.total_referrals === 'number' &&
          typeof totals.total_points === 'number'
        ) {
          setSummary({
            totalReferrals: totals.total_referrals,
            totalPoints: totals.total_points,
          });
        }
      })
      .catch(() => {
        // Silent fallback — static referral flow remains informative.
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const handleCopyCode = async () => {
    if (!code) {
      addToast({ type: 'error', message: 'Referral code unavailable.' });
      return;
    }
    const ok = await copyReferralCode(code);
    if (ok) {
      addToast({ type: 'success', message: 'Referral code copied to clipboard.' });
    } else {
      addToast({ type: 'error', message: 'Could not copy referral code.' });
    }
  };

  const handleCopyLink = async () => {
    if (!code) {
      addToast({ type: 'error', message: 'Referral link unavailable.' });
      return;
    }
    const ok = await copyReferralLink(code);
    if (ok) {
      addToast({ type: 'success', message: 'Referral link copied to clipboard.' });
    } else {
      addToast({ type: 'error', message: 'Could not copy referral link.' });
    }
  };

  return (
    <section aria-label="Engagement and Community Offers" style={{ marginTop: 'var(--space-4)' }}>
      {/* Section Header */}
      <div style={{ marginBottom: '14px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary, #cbd5e1)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Engagement &amp; Community
        </h4>
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px', display: 'block' }}>
          Expand your solar network and earn rewards on verified customer installations
        </span>
      </div>

      <footer
        className="footer-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          alignItems: 'stretch',
        }}
      >
        {/* Card 1: Solar Journey / Next Step */}
        <section className="footer-card footer-banner-card footer-journey-card" aria-label="Your solar journey">
          <div>
            <span className="footer-eyebrow">Your Solar Journey</span>
            <h4 className="footer-banner-text" style={{ fontSize: '18px', lineHeight: 1.3 }}>
              Your roof has potential.<br />Your future has more.
            </h4>
            <p className="footer-banner-sub" style={{ marginTop: '6px' }}>
              Take the next step towards energy independence and zero electricity bills.
            </p>
          </div>
          <div className="footer-journey-media">
            <div className="footer-journey-img-wrap">
              <img className="footer-banner-img footer-journey-img" src="/assets/solar_roof_banner.png" alt="Rooftop solar panel installation" />
            </div>
            <button
              className="footer-banner-btn"
              id="getPlanBtn"
              onClick={() => navigate(ROUTES.ROI_CALCULATOR)}
              style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}
            >
              <span>Get My Solar Plan</span>
              <svg aria-hidden="true"><use href="#icon-arrow-right"></use></svg>
            </button>
          </div>
        </section>

        {/* Card 2: Customer-Specific Refer & Earn */}
        <section className="footer-card refer-card" aria-label="Refer and earn rewards">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
              <h4 className="refer-title" style={{ fontSize: '16px', margin: 0 }}>Refer &amp; Earn</h4>
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#ff8a1d', background: 'rgba(255, 138, 29, 0.1)', padding: '2px 7px', borderRadius: '999px', border: '1px solid rgba(255, 138, 29, 0.25)', whiteSpace: 'nowrap' }}>
                BONUS REWARDS
              </span>
            </div>
            <p className="refer-desc" style={{ fontSize: '11.5px', color: 'var(--text-muted, #94a3b8)', margin: '4px 0 14px' }}>
              Invite friends to switch to solar. Earn rewards when their verified rooftop installation goes live.
            </p>

            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted, #94a3b8)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              Your Unique Referral Code
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="promo-display" id="referralCodeText" style={{ fontSize: '13px', fontWeight: 800, padding: '7px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', letterSpacing: '0.06em', color: '#36D399' }}>
                {code || 'Awaiting Profile Sync'}
              </div>
              <button
                className="btn btn-sm btn-primary"
                id="copyCodeBtn"
                aria-label="Copy referral promo code to clipboard"
                onClick={handleCopyCode}
                style={{ fontSize: '11px', padding: '7px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span aria-hidden="true">📋</span> Copy Code
              </button>
              <button
                className="btn btn-sm btn-secondary"
                id="copyLinkBtn"
                aria-label="Copy referral link to clipboard"
                onClick={handleCopyLink}
                style={{ fontSize: '11px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span aria-hidden="true">🔗</span> Copy Link
              </button>
            </div>

            {summary && (
              <div className="refer-summary" role="status" aria-label="Your referral summary">
                <div className="refer-summary-item">
                  <span className="refer-summary-value">{summary.totalReferrals}</span>
                  <span className="refer-summary-label">Total Referrals</span>
                </div>
                <div className="refer-summary-item">
                  <span className="refer-summary-value">{summary.totalPoints}</span>
                  <span className="refer-summary-label">Reward Points</span>
                </div>
              </div>
            )}

            <ol className="refer-steps" aria-label="How referrals work">
              {REFERRAL_STEPS.map((step, i) => (
                <li key={step.label} className="refer-step">
                  <span className="refer-step-index" aria-hidden="true">{i + 1}</span>
                  <span className="refer-step-text">
                    <strong>{step.label}</strong>
                    <span>{step.hint}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="refer-card-foot">
            <span className="refer-foot-note">Rewards are issued when an eligible installation is verified.</span>
            <img className="refer-gift-img" src="/assets/gift_box.png" alt="" aria-hidden="true" />
          </div>
        </section>
      </footer>
    </section>
  );
}
