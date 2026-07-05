import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdReceiptLong, MdRoofing, MdCalculate,
  MdSmartToy, MdCardGiftcard, MdAssessment, MdSpeed,
  MdSettings, MdLocationOn, MdNotifications,
  MdContentCopy, MdCheckCircle, MdInfo,
  MdArrowBackIos, MdArrowForwardIos
} from 'react-icons/md';
import { FaStar } from 'react-icons/fa';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import './Dashboard.css';

const energyData = [
  { day: 1, thisMonth: 18, lastMonth: 14 }, { day: 5, thisMonth: 22, lastMonth: 18 },
  { day: 10, thisMonth: 30, lastMonth: 25 }, { day: 15, thisMonth: 28, lastMonth: 22 },
  { day: 20, thisMonth: 35, lastMonth: 28 }, { day: 25, thisMonth: 32, lastMonth: 30 },
  { day: 30, thisMonth: 38, lastMonth: 32 },
];
const consumptionData = [
  { day: 1, value: 20 }, { day: 5, value: 28 }, { day: 10, value: 22 },
  { day: 15, value: 35 }, { day: 20, value: 25 }, { day: 25, value: 30 }, { day: 30, value: 18 },
];

const navItems = [
  { icon: <MdDashboard />, label: 'Dashboard', path: '/dashboard' },
  { icon: <MdReceiptLong />, label: 'Bill Analyzer', path: '/bill-analyzer' },
  { icon: <MdRoofing />, label: 'Roof Analysis', path: '/roof-analyzer' },
  { icon: <MdCalculate />, label: 'ROI Calculator', path: '/roi-calculator' },
  { icon: <MdSmartToy />, label: 'AI Assistant', path: '/chat' },
  { icon: <MdCardGiftcard />, label: 'Rewards & Referrals', path: '/referral' },
  { icon: <MdAssessment />, label: 'My Reports', path: '/dashboard' },
  { icon: <MdSpeed />, label: 'System Performance', path: '/dashboard' },
  { icon: <MdSettings />, label: 'Settings', path: '/dashboard' },
];

/* ══════════════════════════════════
   3D-STYLE FEATURE CARD ICONS (SVG)
   matching the reference design exactly
   ══════════════════════════════════ */

/* Bill Analyzer – blue document with yellow tag */
const BillSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    {/* shadow */}
    <ellipse cx="40" cy="74" rx="22" ry="5" fill="#cbd5e1" opacity="0.4"/>
    {/* main doc body */}
    <rect x="16" y="10" width="44" height="56" rx="6" fill="#e0eeff"/>
    <rect x="16" y="10" width="44" height="56" rx="6" fill="url(#bG)"/>
    {/* fold top-right */}
    <path d="M48 10 L60 22 L48 22 Z" fill="#93c5fd"/>
    <path d="M48 10 L60 22 H48 Z" fill="#bfdbfe"/>
    {/* lines */}
    <rect x="22" y="30" width="24" height="3.5" rx="1.75" fill="#93c5fd"/>
    <rect x="22" y="38" width="20" height="3" rx="1.5" fill="#bfdbfe"/>
    <rect x="22" y="45" width="16" height="3" rx="1.5" fill="#bfdbfe"/>
    <rect x="22" y="52" width="18" height="3" rx="1.5" fill="#bfdbfe"/>
    {/* yellow tag bottom-right */}
    <rect x="42" y="50" width="18" height="14" rx="4" fill="#fbbf24"/>
    <rect x="44" y="54" width="14" height="2.5" rx="1.25" fill="#fff" opacity="0.8"/>
    <rect x="44" y="59" width="10" height="2" rx="1" fill="#fff" opacity="0.6"/>
    <defs>
      <linearGradient id="bG" x1="16" y1="10" x2="60" y2="66" gradientUnits="userSpaceOnUse">
        <stop stopColor="#dbeafe"/>
        <stop offset="1" stopColor="#bfdbfe"/>
      </linearGradient>
    </defs>
  </svg>
);

/* Roof Analysis – house with solar panels, orange/yellow roof */
const RoofSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="74" rx="24" ry="5" fill="#cbd5e1" opacity="0.35"/>
    {/* walls */}
    <rect x="14" y="44" width="52" height="26" rx="3" fill="#fef9c3"/>
    {/* door */}
    <rect x="33" y="54" width="14" height="16" rx="3" fill="#92400e" opacity="0.45"/>
    {/* windows */}
    <rect x="18" y="49" width="11" height="9" rx="2" fill="#bae6fd"/>
    <rect x="51" y="49" width="11" height="9" rx="2" fill="#bae6fd"/>
    <line x1="23.5" y1="49" x2="23.5" y2="58" stroke="white" strokeWidth="1"/>
    <line x1="18" y1="53.5" x2="29" y2="53.5" stroke="white" strokeWidth="1"/>
    <line x1="56.5" y1="49" x2="56.5" y2="58" stroke="white" strokeWidth="1"/>
    <line x1="51" y1="53.5" x2="62" y2="53.5" stroke="white" strokeWidth="1"/>
    {/* roof */}
    <path d="M8 46 L40 16 L72 46 Z" fill="#f59e0b"/>
    <path d="M8 46 L40 20 L72 46 Z" fill="#fbbf24"/>
    {/* solar panels on roof */}
    <rect x="24" y="33" width="11" height="7" rx="1.5" fill="#1a5c38" opacity="0.9"/>
    <rect x="37" y="27" width="11" height="7" rx="1.5" fill="#1a5c38" opacity="0.9"/>
    <rect x="50" y="33" width="11" height="7" rx="1.5" fill="#1a5c38" opacity="0.9"/>
    <line x1="29.5" y1="33" x2="29.5" y2="40" stroke="#4ade80" strokeWidth="0.8"/>
    <line x1="42.5" y1="27" x2="42.5" y2="34" stroke="#4ade80" strokeWidth="0.8"/>
    <line x1="55.5" y1="33" x2="55.5" y2="40" stroke="#4ade80" strokeWidth="0.8"/>
  </svg>
);

/* ROI Calculator – green bar chart with gold arrow going up */
const ROISVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="74" rx="22" ry="5" fill="#cbd5e1" opacity="0.35"/>
    {/* background card */}
    <rect x="8" y="12" width="64" height="58" rx="10" fill="#f0fdf4"/>
    {/* bars */}
    <rect x="16" y="50" width="11" height="16" rx="3" fill="#86efac"/>
    <rect x="30" y="40" width="11" height="26" rx="3" fill="#4ade80"/>
    <rect x="44" y="28" width="11" height="38" rx="3" fill="#22c55e"/>
    <rect x="58" y="20" width="11" height="46" rx="3" fill="#1a5c38"/>
    {/* upward arrow */}
    <path d="M52 16 L60 8 L68 16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <line x1="60" y1="8" x2="60" y2="22" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="60" cy="8" r="5" fill="#fbbf24" opacity="0.25"/>
  </svg>
);

/* AI Solar Assistant – cute robot face */
const AISvg = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="74" rx="20" ry="5" fill="#cbd5e1" opacity="0.35"/>
    {/* body glow */}
    <ellipse cx="40" cy="44" rx="28" ry="26" fill="#ede9fe" opacity="0.6"/>
    {/* head */}
    <rect x="16" y="24" width="48" height="42" rx="14" fill="#ddd6fe"/>
    <rect x="16" y="24" width="48" height="42" rx="14" fill="url(#aiG)" opacity="0.5"/>
    {/* antenna */}
    <line x1="40" y1="24" x2="40" y2="12" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="40" cy="10" r="5" fill="#7c3aed"/>
    <circle cx="40" cy="10" r="2.5" fill="#a78bfa"/>
    {/* eyes */}
    <ellipse cx="29" cy="40" rx="7" ry="7" fill="white"/>
    <ellipse cx="51" cy="40" rx="7" ry="7" fill="white"/>
    <circle cx="29" cy="40" r="4.5" fill="#6366f1"/>
    <circle cx="51" cy="40" r="4.5" fill="#6366f1"/>
    <circle cx="30.5" cy="38.5" r="1.5" fill="white"/>
    <circle cx="52.5" cy="38.5" r="1.5" fill="white"/>
    <circle cx="29" cy="40" r="2" fill="#312e81"/>
    <circle cx="51" cy="40" r="2" fill="#312e81"/>
    {/* smile */}
    <path d="M29 54 Q40 61 51 54" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* ears */}
    <rect x="9" y="34" width="7" height="14" rx="3.5" fill="#c4b5fd"/>
    <rect x="64" y="34" width="7" height="14" rx="3.5" fill="#c4b5fd"/>
    {/* sparkle */}
    <path d="M62 20 L63.2 23.8 L67 25 L63.2 26.2 L62 30 L60.8 26.2 L57 25 L60.8 23.8 Z" fill="#fbbf24"/>
    <defs>
      <linearGradient id="aiG" x1="16" y1="24" x2="64" y2="66" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8b5cf6"/>
        <stop offset="1" stopColor="#6366f1"/>
      </linearGradient>
    </defs>
  </svg>
);

/* Rewards & Referrals – gift box red/orange */
const GiftSVG = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    <ellipse cx="40" cy="74" rx="22" ry="5" fill="#cbd5e1" opacity="0.35"/>
    {/* box */}
    <rect x="12" y="42" width="56" height="30" rx="5" fill="#fecaca"/>
    <rect x="12" y="42" width="56" height="30" rx="5" fill="url(#gBox)"/>
    {/* lid */}
    <rect x="8" y="32" width="64" height="12" rx="5" fill="#fca5a5"/>
    {/* ribbon vertical */}
    <rect x="36" y="32" width="8" height="40" rx="2" fill="#ef4444"/>
    {/* ribbon horizontal */}
    <rect x="8" y="36" width="64" height="4" rx="2" fill="#ef4444"/>
    {/* bow left */}
    <path d="M22 32 Q28 20 36 26 Q30 34 22 32Z" fill="#f97316"/>
    {/* bow right */}
    <path d="M54 32 Q48 20 40 26 Q46 34 54 32Z" fill="#f97316"/>
    {/* bow center */}
    <circle cx="38" cy="26" r="5" fill="#fbbf24"/>
    <circle cx="38" cy="26" r="2.5" fill="#f97316"/>
    {/* stars */}
    <circle cx="22" cy="55" r="2.5" fill="#fbbf24" opacity="0.7"/>
    <circle cx="58" cy="58" r="2" fill="#fbbf24" opacity="0.7"/>
    <path d="M60 45 L61 47.2 L63.5 48 L61 48.8 L60 51 L59 48.8 L56.5 48 L59 47.2 Z" fill="#fbbf24" opacity="0.8"/>
    <defs>
      <linearGradient id="gBox" x1="12" y1="42" x2="68" y2="72" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fca5a5"/>
        <stop offset="1" stopColor="#fecdd3"/>
      </linearGradient>
    </defs>
  </svg>
);

/* ── MINI STAT ICONS ── */
const CalSVG = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <rect x="2" y="7" width="34" height="29" rx="5" fill="#ede9fe"/>
    <rect x="2" y="7" width="34" height="12" rx="5" fill="#7c3aed"/>
    <rect x="11" y="2" width="5" height="10" rx="2.5" fill="#5b21b6"/>
    <rect x="22" y="2" width="5" height="10" rx="2.5" fill="#5b21b6"/>
    <rect x="8" y="24" width="7" height="7" rx="2" fill="#c4b5fd"/>
    <rect x="22" y="24" width="7" height="7" rx="2" fill="#c4b5fd"/>
    <rect x="15" y="24" width="7" height="7" rx="2" fill="#ddd6fe"/>
  </svg>
);

const LeafSVG = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <circle cx="19" cy="19" r="17" fill="#dcfce7"/>
    <path d="M19 30 C11 24 8 13 19 8 C30 13 27 24 19 30Z" fill="#16a34a"/>
    <path d="M19 30 C14 22 14 14 19 8" stroke="#86efac" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M19 30 L19 35" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="19" cy="36" r="1.5" fill="#16a34a"/>
  </svg>
);

const SunSVG = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <circle cx="19" cy="19" r="17" fill="#fef9c3"/>
    <circle cx="19" cy="19" r="8" fill="#f59e0b"/>
    <circle cx="19" cy="19" r="5" fill="#fbbf24"/>
    {[0,45,90,135,180,225,270,315].map((deg,i) => {
      const rad = deg * Math.PI / 180;
      return <line key={i}
        x1={19 + 10*Math.cos(rad)} y1={19 + 10*Math.sin(rad)}
        x2={19 + 14*Math.cos(rad)} y2={19 + 14*Math.sin(rad)}
        stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round"/>;
    })}
  </svg>
);

const BatterySVG = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
    <circle cx="19" cy="19" r="17" fill="#d1fae5"/>
    <rect x="5" y="13" width="24" height="12" rx="3" fill="#6ee7b7"/>
    <rect x="29" y="16" width="5" height="6" rx="2" fill="#6b7280"/>
    <rect x="7" y="15" width="16" height="8" rx="2" fill="#059669"/>
    <path d="M16 13 L13 19 L17 19 L14 25" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── CIRCULAR PROGRESS ── */
function CircularProgress({ value, size = 110, strokeWidth = 10, color = '#1a5c38' }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontSize: size > 90 ? 20 : 15, fontWeight: 800, fill: '#1a1a1a' }}>
        {value}%
      </text>
    </svg>
  );
}

const features = [
  { SvgIcon: BillSVG,  title: 'Bill Analyzer',      path: '/bill-analyzer',  desc: 'Upload your electricity bill and discover your savings potential.', btn: 'Analyze Bill' },
  { SvgIcon: RoofSVG,  title: 'Roof Analysis',       path: '/roof-analyzer',  desc: 'AI + Satellite analysis of your roof for accurate solar estimate.',  btn: 'Analyze Roof' },
  { SvgIcon: ROISVG,   title: 'ROI Calculator',      path: '/roi-calculator', desc: 'Calculate returns, savings and payback period instantly.',            btn: 'Calculate ROI' },
  { SvgIcon: AISvg,    title: 'AI Solar Assistant',  path: '/chat',           desc: 'Ask anything about solar energy. Your AI energy expert.',            btn: 'Ask AI' },
  { SvgIcon: GiftSVG,  title: 'Rewards & Referrals', path: '/referral',       desc: 'Earn rewards and help your friends switch to solar.',                 btn: 'Invite & Earn' },
];

/* ════════════════ MAIN COMPONENT ════════════════ */
export default function Dashboard() {
  const [user, setUser]         = useState(null);
  const [greeting, setGreeting] = useState('Good Morning');
  const [copied, setCopied]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ud = localStorage.getItem('user');
    if (!ud) { navigate('/'); return; }
    setUser(JSON.parse(ud));
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');
  }, [navigate]);

  const logout = () => { localStorage.clear(); navigate('/'); };
  const copyReferral = () => {
    if (user?.referral_code) navigator.clipboard.writeText(user.referral_code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;
  const path = window.location.pathname;

  return (
    <div className="db-root">

      {/* ══════ SIDEBAR ══════ */}
      <aside className="db-sidebar">
        <div className="db-logo">
          <div className="db-logo-icon">☀️</div>
          <span className="db-logo-text">GET Solar<br/>Energy</span>
        </div>
        <nav className="db-nav">
          {navItems.map((item, i) => (
            <Link key={i} to={item.path}
              className={`db-nav-item${path === item.path && i < 6 ? ' active' : ''}`}>
              <span className="db-nav-icon">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="db-sidebar-card">
          <img src="https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=200&q=80"
            alt="solar home" className="db-sidebar-img"/>
          <div className="db-sidebar-tagline">Make Every Sunbeam Count</div>
          <div className="db-sidebar-sub">Switch to solar. Save more. Live better.</div>
          <Link to="/bill-analyzer">
            <button className="db-sidebar-btn">Explore Solar →</button>
          </Link>
        </div>
        <div className="db-pro-card">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>⭐</span>
            <div>
              <div style={{fontWeight:700,fontSize:13}}>GET Solar Pro</div>
              <div style={{fontSize:11,opacity:0.7}}>Pro Plan · Valid till 28 Feb 2026</div>
            </div>
          </div>
          <div className="db-pro-bar"><div className="db-pro-fill"/></div>
          <div style={{fontSize:11,opacity:0.7,marginTop:4}}>85% Used</div>
        </div>
      </aside>

      {/* ══════ MAIN ══════ */}
      <main className="db-main">
        <header className="db-topbar">
          <div>
            <h1 className="db-topbar-title">{greeting}, {user.name} 👋</h1>
            <p className="db-topbar-sub">Here's what's happening with your solar journey today.</p>
          </div>
          <div className="db-topbar-right">
            <div className="db-location-chip">
              <MdLocationOn size={16} color="#1a5c38"/>
              {user.city}, Uttar Pradesh <span style={{opacity:0.5,marginLeft:4}}>▼</span>
            </div>
            <div className="db-icon-btn">
              <MdNotifications size={20}/><span className="db-badge">3</span>
            </div>
            <div className="db-avatar-wrap" onClick={logout} title="Logout">
              <div className="db-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{user.name}</div>
                <div style={{fontSize:11,color:'#6b7280'}}>Premium User</div>
              </div>
              <span style={{opacity:0.4}}>▼</span>
            </div>
          </div>
        </header>

        <div className="db-content">

          {/* ROW 1 */}
          <div className="db-row1">
            <div className="db-hero">
              <div className="db-hero-text">
                <div className="db-hero-eyebrow">✨ AI INSIGHT FOR YOU</div>
                <h2 className="db-hero-heading">Your Solar Future is<br/>Looking Bright! ☀️</h2>
                <p className="db-hero-sub">Based on your roof, usage &amp; location</p>
                <p className="db-hero-save-label">You can save up to</p>
                <div className="db-hero-amount">₹24,860 <span>/year</span></div>
                <div className="db-hero-tags">
                  <span>🛡️ AI Powered Analysis</span>
                  <span>🏛️ Govt. Subsidy Eligible</span>
                  <span>✅ Personalized Plan Ready</span>
                </div>
              </div>
              <div className="db-hero-img-wrap">
                <img src="https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=340&q=80"
                  alt="solar house" className="db-hero-img"/>
              </div>
            </div>

            <div className="db-widgets">
              <div className="db-widget-card">
                <div className="db-widget-header">
                  <span className="db-widget-title">Solar Readiness Score</span>
                  <MdInfo size={16} color="#9ca3af"/>
                </div>
                <div className="db-readiness-row">
                  <CircularProgress value={92}/>
                  <div>
                    <div style={{fontWeight:700,color:'#1a5c38',fontSize:15}}>Excellent!</div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:3}}>Your home is ready for solar.</div>
                  </div>
                </div>
                <button className="db-view-btn">View Details →</button>
              </div>
              <div className="db-widget-card">
                <div className="db-widget-header">
                  <span className="db-widget-title">Estimated Annual Savings</span>
                </div>
                <div className="db-savings-amount">₹24,860</div>
                <div style={{fontSize:12,color:'#16a34a',marginBottom:8}}>↑ +18.2% vs last month</div>
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={energyData}>
                    <Line type="monotone" dataKey="thisMonth" stroke="#1a5c38" dot={false} strokeWidth={2}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="db-widget-card">
                <div style={{fontSize:12,color:'#6b7280'}}>Lifetime Savings (25 Years)</div>
                <div style={{fontSize:22,fontWeight:800,color:'#1a1a1a',margin:'6px 0'}}>₹12.4 Lakhs</div>
                <ResponsiveContainer width="100%" height={35}>
                  <BarChart data={energyData.slice(0,5)}>
                    <Bar dataKey="thisMonth" fill="#1a5c38" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* MINI STATS */}
          <div className="db-mini-stats">
            {[
              { Icon: CalSVG,     label: 'ROI Period',          value: '3.8 Years', sub: 'Excellent Return' },
              { Icon: LeafSVG,    label: 'Carbon Offset',       value: '12.4 Tons', sub: 'CO₂ Reduced' },
              { Icon: SunSVG,     label: 'System Size',         value: '5.2 kW',    sub: 'Optimal Size' },
              { Icon: BatterySVG, label: 'Energy Independence', value: '78%',       sub: 'Projected' },
            ].map(({ Icon, label, value, sub }, i) => (
              <div key={i} className="db-mini-stat">
                <Icon/>
                <div>
                  <div style={{fontSize:11,color:'#9ca3af'}}>{label}</div>
                  <div style={{fontWeight:700,fontSize:17,color:'#1a1a1a'}}>{value}</div>
                  <div style={{fontSize:11,color:'#6b7280'}}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FEATURE CARDS */}
          <div className="db-features">
            {features.map(({ SvgIcon, title, path: fPath, desc, btn }, i) => (
              <Link key={i} to={fPath} style={{textDecoration:'none'}}>
                <div className="db-feature-card">
                  <div className="db-feature-icon-wrap"><SvgIcon/></div>
                  <div className="db-feature-title">{title}</div>
                  <div className="db-feature-desc">{desc}</div>
                  <button className="db-feature-btn">{btn} →</button>
                </div>
              </Link>
            ))}
          </div>

          {/* CHARTS */}
          <div className="db-charts-row">
            <div className="db-chart-card">
              <div className="db-chart-header">
                <span className="db-chart-title">Energy Production</span>
                <span className="db-chart-pill">This Month ▼</span>
              </div>
              <div style={{display:'flex',gap:16,marginBottom:10}}>
                <span className="db-legend green">— This Month</span>
                <span className="db-legend gray">— Last Month</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={energyData} barSize={10}>
                  <XAxis dataKey="day" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip/>
                  <Bar dataKey="thisMonth" fill="#1a5c38" radius={[4,4,0,0]}/>
                  <Bar dataKey="lastMonth"  fill="#d1fae5" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <div className="db-chart-footer">
                <span>Total Generated<br/><strong>486 kWh</strong></span>
                <span style={{color:'#16a34a',fontSize:12}}>↑ +22.5% vs last month</span>
              </div>
            </div>

            <div className="db-chart-card">
              <div className="db-chart-header">
                <span className="db-chart-title">Electricity Consumption</span>
                <span className="db-chart-pill">This Month ▼</span>
              </div>
              <div style={{marginBottom:10}}/>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={consumptionData}>
                  <defs>
                    <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip/>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#cG)"/>
                </AreaChart>
              </ResponsiveContainer>
              <div className="db-chart-footer">
                <span>Total Consumed<br/><strong>362 kWh</strong></span>
                <span style={{color:'#ef4444',fontSize:12}}>↓ -12.4% vs last month</span>
              </div>
            </div>  

            <div className="db-chart-card">
              <div className="db-chart-title" style={{marginBottom:12}}>Government Subsidy</div>
              <div className="db-subsidy-badge">✅ Eligible for Subsidy</div>
              <div style={{fontSize:26,fontWeight:800,color:'#1a1a1a',margin:'10px 0 6px'}}>₹78,000</div>
              <p style={{fontSize:12,color:'#6b7280',lineHeight:1.5}}>
                You are eligible for central and state government subsidy.
              </p>
              <div style={{textAlign:'center',margin:'12px 0'}}>
                <svg viewBox="0 0 64 64" width="60" height="60">
                  <circle cx="32" cy="32" r="30" fill="#fef9c3"/>
                  <rect x="18" y="22" width="28" height="32" rx="3" fill="#f59e0b"/>
                  <rect x="22" y="18" width="20" height="10" rx="2" fill="#fbbf24"/>
                  <rect x="14" y="40" width="36" height="5" rx="1.5" fill="#92400e" opacity="0.25"/>
                  <path d="M27 33 L30 37 L38 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <button className="db-subsidy-btn">Check Eligibility →</button>
            </div>

            <div className="db-chart-card">
              <div className="db-chart-title" style={{marginBottom:12}}>System Performance</div>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                <CircularProgress value={88} size={76} strokeWidth={8} color="#1a5c38"/>
                <div style={{fontSize:13,fontWeight:700,color:'#1a5c38'}}>Excellent</div>
              </div>
              {[{label:'Inverter',val:98},{label:'Panels',val:91},{label:'Battery',val:76},{label:'Wiring',val:87}]
                .map((p,i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#6b7280'}}>
                    <span style={{width:6,height:6,borderRadius:'50%',background:'#1a5c38',display:'inline-block'}}/>
                    {p.label}
                  </div>
                  <span style={{fontWeight:700,fontSize:13}}>{p.val}%</span>
                </div>
              ))}
              <button className="db-subsidy-btn" style={{marginTop:8}}>View All Insights →</button>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="db-bottom-row">
            <div className="db-testimonial-card">
              <div className="db-chart-title" style={{marginBottom:14}}>What Our Customers Say</div>
              <div className="db-testimonial-body">
                <div className="db-testi-avatar">A</div>
                <div>
                  <div style={{display:'flex',gap:2,marginBottom:6}}>
                    {[...Array(5)].map((_,i)=><FaStar key={i} color="#f59e0b" size={13}/>)}
                  </div>
                  <p style={{fontSize:13,color:'#374151',lineHeight:1.5,fontStyle:'italic'}}>
                    "GET Solar Energy made going solar super simple. Saved over ₹1.8 Lakhs in the first year!"
                  </p>
                  <div style={{fontSize:12,color:'#6b7280',marginTop:8}}>Arjun Mehta, Jaipur</div>
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:14}}>
                <button className="db-nav-arrow"><MdArrowBackIos size={14}/></button>
                <div style={{display:'flex',gap:5}}>
                  {[0,1,2].map(i=><span key={i} style={{width:i===0?16:6,height:6,borderRadius:3,background:i===0?'#1a5c38':'#d1d5db'}}/>)}
                </div>
                <button className="db-nav-arrow"><MdArrowForwardIos size={14}/></button>
              </div>
            </div>

            <div className="db-cta-banner">
              <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80"
                alt="solar" className="db-cta-img"/>
              <div className="db-cta-overlay">
                <h3 className="db-cta-heading">Your roof has potential.<br/>Your future has more.</h3>
                <p className="db-cta-sub">Take the next step towards energy independence.</p>
                <Link to="/bill-analyzer">
                  <button className="db-cta-btn">Get My Solar Plan →</button>
                </Link>
              </div>
            </div>

            <div className="db-refer-card">
              <div className="db-chart-title" style={{marginBottom:6}}>Refer &amp; Earn</div>
              <p style={{fontSize:12,color:'#6b7280',marginBottom:16,lineHeight:1.5}}>
                Invite your friends and earn exciting rewards when they switch to solar.
              </p>
              <div style={{fontSize:12,color:'#374151',marginBottom:6,fontWeight:600}}>Your Referral Code</div>
              <div className="db-referral-box">
                <span className="db-referral-code">{user.referral_code || 'SOLAR2024'}</span>
                <button className="db-copy-btn" onClick={copyReferral}>
                  {copied ? <MdCheckCircle size={16} color="#16a34a"/> : <MdContentCopy size={16}/>}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div style={{marginTop:14,fontSize:12,color:'#6b7280'}}>🎁 You earn 100 pts · Friend gets 50 pts</div>
              <div style={{textAlign:'center',marginTop:14}}><GiftSVG/></div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}