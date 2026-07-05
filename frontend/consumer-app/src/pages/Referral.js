import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Referral() {
  const [user, setUser] = useState(null);
  const [points, setPoints] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [applyCode, setApplyCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const u = JSON.parse(userData);
      setUser(u);
      setReferralCode(u.referral_code);
      fetchPoints(u.email);
    }
  }, []);

  const fetchPoints = async (email) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/referral/points/${email}`);
      if (res.data.success) {
        setPoints(res.data.points);
      }
    } catch (err) {}
  };

  const applyReferral = async () => {
    if (!applyCode.trim()) { setError('Please enter a referral code'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await axios.post('http://localhost:8000/api/referral/apply', {
        referral_code: applyCode,
        new_user_email: user.email
      });
      if (res.data.success) {
        setMessage(`🎉 Success! You earned ${res.data.new_user_points_earned} points!`);
        fetchPoints(user.email);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError('Failed to apply referral code.');
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#e74c3c', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🎁 Rewards & Referrals</h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>

      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Points Card */}
        <div style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', padding: '30px', borderRadius: '16px', marginBottom: '20px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{points}</div>
          <div style={{ fontSize: '18px', marginTop: '8px' }}>Total Reward Points</div>
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>Earn 50 pts per referral!</div>
        </div>

        {/* Your Referral Code */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Your Referral Code</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center', letterSpacing: '4px', color: '#e74c3c' }}>
              {referralCode}
            </div>
            <button onClick={copyCode}
              style={{ padding: '15px 20px', background: copied ? '#27ae60' : '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <p style={{ color: '#888', fontSize: '13px', marginTop: '10px' }}>Share this code with friends — they get 50 pts, you get 100 pts!</p>
        </div>

        {/* Apply Referral Code */}
        <div style={{ background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>Apply a Referral Code</h2>
          {message && <div style={{ background: '#efffef', color: '#27ae60', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}
          {error && <div style={{ background: '#fee', color: '#e74c3c', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
          <input
            type="text"
            placeholder="Enter referral code"
            value={applyCode}
            onChange={e => setApplyCode(e.target.value.toUpperCase())}
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', marginBottom: '15px', boxSizing: 'border-box', letterSpacing: '2px' }}
          />
          <button onClick={applyReferral} disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '🔄 Applying...' : '🎁 Apply Code'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Referral;