import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#f39c12', fontSize: '28px', fontWeight: 'bold' }}>☀️ GET Solar</h1>
          <p style={{ color: '#666', marginTop: '8px' }}>India's Solar Intelligence Platform</p>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>Login</h2>
        {error && <div style={{ background: '#fee', color: '#c00', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '15px', fontSize: '15px', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', fontSize: '15px', boxSizing: 'border-box' }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f39c12, #e67e22)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#f39c12', fontWeight: 'bold' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;