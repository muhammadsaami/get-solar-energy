import React, { useState } from 'react'

const FAQS = [
  {
    q: 'How does PM Surya Ghar: Muft Bijli Yojana subsidy work?',
    a: 'Under the PM Surya Ghar scheme, residential consumers receive an upfront direct subsidy of ₹30,000 per kW up to 2 kW capacity, and ₹18,000 for the 3rd kW (maximum subsidy ₹78,000 for 3 kW+). The subsidy is credited directly to your verified bank account following DISCOM net-metering installation.',
  },
  {
    q: 'What is bi-directional net metering and how does it reduce my bill?',
    a: 'A bi-directional net meter records both electricity drawn from the DISCOM grid and excess solar generation fed back into the grid. At the end of each billing cycle, your DISCOM bills you only for the net difference.',
  },
  {
    q: 'What happens if my solar system generates more power than I use?',
    a: 'Excess generation is banked with your local DISCOM. Depending on state tariff regulations (e.g., JVVNL, BSES, MSEDCL), excess banked energy credits are either rolled over or paid out annually during the settlement month.',
  },
  {
    q: 'What warranties are included with GET Solar installations?',
    a: 'All Tier-1 Solar PV Modules carry a 25-year linear performance warranty (min 84.8% power output at Year 25). Solar string inverters include a 10-year replacement warranty, mounting structures carry a 15-year structural warranty, and GET Solar provides a 5-year workmanship guarantee.',
  },
]

export default function SupportHelp() {
  const [search, setSearch] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMsg, setTicketMsg] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  const filteredFaqs = FAQS.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketSubject.trim() || !ticketMsg.trim()) return
    const subject = encodeURIComponent(`[GET Solar Support] ${ticketSubject}`)
    const body = encodeURIComponent(ticketMsg)
    window.location.href = `mailto:support@getsolar.in?subject=${subject}&body=${body}`
    setTicketSubmitted(true)
  }

  const resetTicket = () => {
    setTicketSubmitted(false)
    setTicketSubject('')
    setTicketMsg('')
  }

  return (
    <div className="ew-page" role="tabpanel" aria-label="support help">
      <header className="ew-mission-bar" role="banner" aria-label="Support Help Header">
        <div className="ew-mission-scope">
          <span className="ew-live-dot" />
          <span className="ew-scope-badge">SUPPORT / DESK</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Customer Support Desk &amp; Technical Knowledge Base</span>
        </div>

        <div className="ew-mission-stats">
          <div className="ew-mission-stat-item">
            <span>SLA Response:</span>
            <strong style={{ color: 'var(--color-green)' }}>&lt; 2 HOURS</strong>
          </div>
        </div>
      </header>

      <div className="card-glass" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
          Customer Support &amp; Solar Knowledge Base
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          Instant answers to solar questions, technical ticketing, and direct advisor escalation.
        </p>

        <div style={{ marginTop: 'var(--space-4)', maxWidth: '540px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search FAQs, subsidy policies, net-metering guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
          />
        </div>
      </div>

      <div className="ew-asym-65-35" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
        {/* LEFT: FAQ Accordion */}
        <div className="card-base" style={{ padding: 'var(--space-4)' }}>
          <div className="ew-divider-head">
            <h3 className="ew-divider-title">Frequently Asked Questions</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} style={{ borderRadius: '6px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{ width: '100%', padding: '12px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '14px', color: 'var(--color-cyan)' }}>{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 14px 12px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Direct Technical Support Ticket */}
        <div className="card-base" style={{ padding: 'var(--space-4)' }}>
          <div className="ew-divider-head">
            <h3 className="ew-divider-title">Open Technical Support Ticket</h3>
          </div>

          {ticketSubmitted ? (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(54, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(54, 211, 153, 0.25)' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-green)', margin: '0 0 4px' }}>Ticket Dispatched</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>Your default email client has been opened with your inquiry.</p>
              <button className="btn btn-ghost btn-sm" onClick={resetTicket}>
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Subject / Issue Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inverter Error Code F24, Net-Meter delay"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Please describe your system symptoms, DISCOM consumer number, or inspection questions..."
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '12px' }}>
                ✉ Dispatch to Engineering Support
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
