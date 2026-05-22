import React from 'react';
import { Link } from 'react-router-dom';
import { Map } from 'lucide-react';

const T = {
  900: '#1a4a4a',
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

const Footer = () => {
  const linkStyle = {
    color: T[300],
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 400,
    transition: 'color 0.18s',
  };

  return (
    <footer style={{ backgroundColor: T[900], borderTop: `0.5px solid ${T[800]}` }}>
      {/* Main footer body */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '52px 1.5rem 36px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '48px' }}>

        {/* Brand column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Map size={18} color={T[500]} />
            <span style={{ color: T[50], fontWeight: 500, fontSize: '0.95rem' }}>
              Indoor<span style={{ color: T[500] }}>Nav</span>
            </span>
          </div>
          <p style={{ color: T[300], fontSize: '0.83rem', fontWeight: 400, lineHeight: 1.7, maxWidth: '280px', marginBottom: '18px' }}>
            A smart campus navigation system powered by the A* algorithm. Built for Acropolis Institute of Technology and Research, Indore.
          </p>
          <p style={{ color: T[600], fontSize: '0.75rem', fontWeight: 400 }}>Minor Project 2026</p>
        </div>

        {/* Navigation links */}
        <div>
          <p style={{ color: T[500], fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Navigation</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Home',       to: '/' },
              { label: 'Navigate',   to: '/navigate' },
              { label: 'Sign In',    to: '/login' },
              { label: 'Register',   to: '/register' },
              { label: 'Admin',      to: '/admin-login' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} style={linkStyle}
                onMouseEnter={e => e.target.style.color = T[50]}
                onMouseLeave={e => e.target.style.color = T[300]}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p style={{ color: T[500], fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Team</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Prabhat Kumar Ahirwar', 'Priyanshi Khorwal', 'Nital Agrawal', 'Nitin Patidar'].map(name => (
              <span key={name} style={{ color: T[300], fontSize: '0.83rem', fontWeight: 400 }}>{name}</span>
            ))}
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: `0.5px solid ${T[800]}` }}>
              <span style={{ color: T[600], fontSize: '0.75rem' }}>Guide: </span>
              <span style={{ color: T[300], fontSize: '0.75rem', fontWeight: 500 }}>Prof. Ritika Bhatt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: `0.5px solid ${T[800]}`, padding: '16px 1.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <p style={{ color: T[600], fontSize: '0.75rem', fontWeight: 400, margin: 0 }}>
            © 2026 IndoorNav — Acropolis Institute of Technology and Research
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Home', 'Navigate', 'Sign In'].map((item, i) => (
              <Link key={i} to={['/', '/navigate', '/login'][i]}
                style={{ color: T[600], fontSize: '0.73rem', textDecoration: 'none', fontWeight: 400, transition: 'color 0.18s' }}
                onMouseEnter={e => e.target.style.color = T[300]}
                onMouseLeave={e => e.target.style.color = T[600]}>
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
