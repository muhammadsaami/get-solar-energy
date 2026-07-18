import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      // Mock signup logic - automatically logs the user in upon success
      const res = await login(form.email, form.password);
      if (res.success) {
        navigate('/app/home');
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep-blue)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-card" style={{
        padding: '40px 40px',
        width: '100%',
        maxWidth: '460px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.28)',
        boxSizing: 'border-box',
        background: 'rgba(8, 24, 42, 0.72)',
        backdropFilter: 'blur(20px)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--color-orange)', letterSpacing: '-0.5px' }}>
            ☀️ GET SOLAR
          </span>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '6px', margin: '6px 0 0 0' }}>
            Create your solar intelligence profile
          </p>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>
          Register Account
        </h2>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {['name', 'phone', 'email', 'password', 'city'].map(field => (
            <div key={field}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                placeholder={`Enter your ${field}`}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                required={field === 'email' || field === 'password' || field === 'name'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(6, 15, 31, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color var(--duration-fast) var(--ease-standard)'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 30px rgba(255, 138, 29, 0.2)',
              marginTop: '10px',
              transition: 'all var(--duration-fast) var(--ease-standard)'
            }}
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: 'var(--color-orange)', fontWeight: '700', textDecoration: 'none' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}