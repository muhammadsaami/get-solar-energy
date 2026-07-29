import React from 'react';

export default function FooterGrid() {
  return (
    <footer className="footer-grid">
      {/* Testimonials (Column 1) */}
      <section className="footer-card">
        <div className="test-header-row">
          <h4 className="analytics-title">What Our Customers Say</h4>
          <div className="test-stars">
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
            <svg><use href="#icon-star"></use></svg>
          </div>
        </div>
        <p className="test-quote" id="testQuoteText">
          "GET Solar Energy made going solar super simple. Saved over ₹1.8 Lakhs in the first year!"
        </p>
        <div className="test-profile-row">
          <div className="test-user-box">
            <img className="test-avatar" id="testQuoteAvatar" src="/assets/customer_avatar.png" alt="Arjun Mehta test headshot picture" />
            <div className="test-info">
              <span className="test-name" id="testQuoteName">Arjun Mehta</span>
              <span className="test-loc" id="testQuoteLoc">Jaipur</span>
            </div>
          </div>
          <div className="test-arrows">
            <button className="test-arrow-btn" id="prevTestBtn" aria-label="Previous Testimonial">
              <svg><use href="#icon-arrow-left"></use></svg>
            </button>
            <button className="test-arrow-btn" id="nextTestBtn" aria-label="Next Testimonial">
              <svg><use href="#icon-arrow-right"></use></svg>
            </button>
          </div>
        </div>
      </section>

      {/* Banner Card (Column 2) */}
      <section className="footer-card footer-banner-card">
        <div>
          <h4 className="footer-banner-text">Your roof has potential.<br />Your future has more.</h4>
          <p className="footer-banner-sub">Take the next step towards energy independence.</p>
        </div>
        <img className="footer-banner-img" src="/assets/solar_roof_banner.png" alt="Solar roof installation banner details" />
        <button className="footer-banner-btn" id="getPlanBtn" onClick={(e) => { e.preventDefault(); }}>
          <span>Get My Solar Plan</span>
          <svg><use href="#icon-arrow-right"></use></svg>
        </button>
      </section>

      {/* Refer and Earn (Column 3) */}
      <section className="footer-card refer-card">
        <div>
          <h4 className="refer-title">Refer & Earn</h4>
          <p className="refer-desc">Invite your friends and earn exciting rewards when they switch to solar.</p>
        </div>
        <div className="refer-row-action">
          <div className="promo-display" id="referralCodeText">SOLAR2024</div>
          <button className="copy-btn" id="copyCodeBtn" aria-label="Copy referral promo code to clipboard">
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
