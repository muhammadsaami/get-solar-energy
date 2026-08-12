import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import { getUser } from '../../utils/referral';
import { useNotificationStore } from '../../stores/notificationStore';
import type { CustomerDashboardData } from '../../hooks/useCustomerDashboard';

interface Props {
  data: CustomerDashboardData;
}

export default function FooterGrid({ data }: Props) {
  const navigate = useNavigate();
  const addToast = useNotificationStore((s) => s.addToast);
  const stats = data.stats || {};
  const code = getUser()?.referral_code || 'SOLAR2024';
  const customers = stats.customers ? Number(stats.customers) : null;
  const bills = stats.bills_analyzed ? Number(stats.bills_analyzed) : null;

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(code);
      addToast({ type: 'success', message: 'Referral code copied.' });
    } catch {
      addToast({ type: 'error', message: 'Could not copy referral code.' });
    }
  };

  return (
    <footer className="footer-grid">
      <section className="footer-card">
        <div className="test-header-row">
          <h4 className="analytics-title">Trusted on the Grid</h4>
          <div className="test-stars">
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
          </div>
        </div>
        <p className="test-quote" id="testQuoteText">
          {customers != null && bills != null
            ? `Join ${customers.toLocaleString()} customers and ${bills.toLocaleString()} bills analyzed toward smarter energy & lower costs.`
            : 'Take the next step towards affordable, clean solar energy.'}
        </p>
        <div className="test-profile-row">
          <div className="test-user-box">
            <img className="test-avatar" id="testQuoteAvatar" src="/assets/customer_avatar.png" alt="GET Solar Energy customer" />
            <div className="test-info">
              <span className="test-name" id="testQuoteName">GET Solar Energy</span>
              <span className="test-loc" id="testQuoteLoc">India</span>
            </div>
          </div>
        </div>
      </section>

      <section className="footer-card footer-banner-card">
        <div>
          <h4 className="footer-banner-text">Your roof has potential.<br />Your future has more.</h4>
          <p className="footer-banner-sub">Take the next step towards energy independence.</p>
        </div>
        <img className="footer-banner-img" src="/assets/solar_roof_banner.png" alt="Solar roof installation banner details" />
        <button className="footer-banner-btn" id="getPlanBtn" onClick={() => navigate(ROUTES.ROI_CALCULATOR)}>
          <span>Get My Solar Plan</span>
          <svg><use href="#icon-arrow-right"></use></svg>
        </button>
      </section>

      <section className="footer-card refer-card">
        <div>
          <h4 className="refer-title">Refer & Earn</h4>
          <p className="refer-desc">Invite your friends and earn exciting rewards when they switch to solar.</p>
        </div>
        <div className="refer-row-action">
          <div className="promo-display" id="referralCodeText">{code}</div>
          <button className="copy-btn" id="copyCodeBtn" aria-label="Copy referral promo code to clipboard" onClick={copyCode}>
            <svg><use href="#icon-copy"></use></svg>
          </button>
        </div>
        <div className="refer-footer-row">
          <img className="refer-gift-img" src="/assets/gift_box.png" alt="Clean minimalist white gift box with green ribbon" />
        </div>
      </section>
    </footer>
  );
}