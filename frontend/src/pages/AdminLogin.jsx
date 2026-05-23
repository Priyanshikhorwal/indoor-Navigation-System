import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Lock } from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/admin-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    try {
      // Use the dedicated admin login endpoint — no user login fallback
      const response = await api.adminLogin(email, password);
      const userRole = response.data.role;

      if (userRole === 'ROLE_ADMIN') {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('email', response.data.email);
        localStorage.setItem('role', 'ROLE_ADMIN');
        navigate('/admin/dashboard');
      } else {
        // Should never happen given the backend, but guard anyway
        setError('Unauthorized Admin Access');
      }
    } catch (err) {
      // Show the exact server error message (e.g. "Unauthorized Admin Access")
      const serverError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Unauthorized Admin Access';
      setError(serverError);
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
        {/* Lock Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            backgroundColor: T[50],
            border: `0.5px solid ${T[100]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>

        <h2 style={{
          color: T[900],
          fontSize: '20px',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: '4px',
          letterSpacing: '-0.02em',
        }}>
          Admin Portal
        </h2>
        <p style={{
          color: T[800],
          fontSize: '12px',
          fontWeight: 400,
          textAlign: 'center',
          marginBottom: '28px',
          lineHeight: '1.6',
        }}>
          Restricted access — authorised personnel only
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fff5f5',
            color: '#b91c1c',
            border: '0.5px solid #fecaca',
            borderRadius: '4px',
            padding: '12px 16px',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="admin-email" style={{
              color: T[900],
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="priyanshikhorwal@gmail.com"
              autoComplete="username"
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
            <label htmlFor="admin-password" style={{
              color: T[900],
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  border: `0.5px solid ${T[300]}`,
                  borderRadius: '4px',
                  padding: '10px 40px 10px 14px',
                  fontSize: '13px',
                  fontWeight: 400,
                  color: T[900],
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
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
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: T[600],
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            id="admin-login-btn"
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? T[300] : T[600],
              color: '#ffffff',
              border: `0.5px solid ${loading ? T[300] : T[800]}`,
              borderRadius: '4px',
              padding: '12px 24px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              textAlign: 'center',
              marginTop: '4px',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = T[800]; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = T[600]; }}
          >
            {loading ? 'Verifying...' : 'Sign In as Administrator'}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '11px',
          color: T[600],
        }}>
          Secured by JWT · Single-admin policy enforced
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
