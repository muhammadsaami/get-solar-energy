import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/signup', form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h1 style={{ color: '#f39c12', fontSize: '28px', fontWeight: 'bold' }}>☀️ GET Solar</h1>
          <p style={{ color: '#666' }}>Create your account</p>
        </div>
        {error && <div style={{ background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
        {['name', 'phone', 'email', 'password', 'city'].map(field => (
          <input
            key={field}
            type={field === 'password' ? 'password' : 'text'}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={e => setForm({ ...form, [field]: e.target.value })}
            style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '12px', fontSize: '15px', boxSizing: 'border-box' }}
          />
        ))}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f39c12, #e67e22)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Already have an account? <Link to="/" style={{ color: '#f39c12', fontWeight: 'bold' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;