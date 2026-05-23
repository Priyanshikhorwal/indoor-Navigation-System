import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const T = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Backend authentication API
      const response = await api.post('/auth/login', { email, password });
      const userRole = response.data.role || 'ROLE_USER';

      if (userRole === 'ROLE_ADMIN') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('email', email);
        localStorage.setItem('role', 'ROLE_ADMIN');
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized. This portal is reserved for Map Administrators.');
      }
    } catch (err) {
      console.error('Admin Auth Error:', err);
      
      // Developer testing fallback: permit login with admin@example.com / admin
      if (email === 'admin@example.com' && password === 'admin') {
        localStorage.setItem('token', 'mock-jwt-token-for-dev-admin-dashboard');
        localStorage.setItem('email', email);
        localStorage.setItem('role', 'ROLE_ADMIN');
        navigate('/admin/dashboard');
      } else {
        setError(
          err.response?.data?.error || 
          err.response?.data?.message || 
          'Authentication failed. Please verify admin credentials.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: T[50],
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: `0.5px solid ${T[300]}`,
        borderRadius: '4px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: 'none',
      }}>
        <h2 style={{
          color: T[900],
          fontSize: '22px',
          fontWeight: 500,
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}>
          Indoor Nav Admin
        </h2>
        <p style={{
          color: T[800],
          fontSize: '13px',
          fontWeight: 400,
          textAlign: 'center',
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          Administrative Login Console
        </p>

        {error && (
          <div style={{
            backgroundColor: T[50],
            color: '#b91c1c',
            border: '0.5px solid #fecaca',
            borderRadius: '4px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 400,
            marginBottom: '24px',
            lineHeight: '1.5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{
              color: T[900],
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{
                border: `0.5px solid ${T[300]}`,
                borderRadius: '4px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 400,
                color: T[900],
                backgroundColor: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = T[500];
                e.target.style.boxShadow = `0 0 0 2px ${T[100]}`;
              }}
              onBlur={e => {
                e.target.style.borderColor = T[300];
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{
              color: T[900],
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                border: `0.5px solid ${T[300]}`,
                borderRadius: '4px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 400,
                color: T[900],
                backgroundColor: '#ffffff',
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = T[500];
                e.target.style.boxShadow = `0 0 0 2px ${T[100]}`;
              }}
              onBlur={e => {
                e.target.style.borderColor = T[300];
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: T[600],
              color: '#ffffff',
              border: `0.5px solid ${T[800]}`,
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s',
              textAlign: 'center',
              marginTop: '12px',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = T[800]}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = T[600]}
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
