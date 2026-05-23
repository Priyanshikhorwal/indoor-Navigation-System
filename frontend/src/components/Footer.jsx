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

const NAV_LINKS = [
  { label: 'Home',       to: '/' },
  { label: 'Navigate',   to: '/navigate' },
  { label: 'About',      to: '/about' },
  { label: 'Sign In',    to: '/login' },
  { label: 'Register',   to: '/register' },
  { label: 'Admin',      to: '/admin/login' },
];

const TEAM = [
  'Prabhat Kumar Ahirwar',
  'Priyanshi Khorwal',
  'Nital Agrawal',
  'Nitin Patidar',
];

const Footer = () => {
  const colLabel = {
    color: T[500],
    fontSize: '0.68rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.13em',
    marginBottom: '16px',
    display: 'block',
  };

  const footerLink = {
    color: T[300],
    textDecoration: 'none',
    fontSize: '13px',        /* ← min 13px body text */
    fontWeight: 400,
    transition: 'color 0.18s',
    display: 'block',
  };

  return (
    <footer style={{ backgroundColor: T[900], borderTop: `0.5px solid ${T[800]}` }}>

      {/* 3-column body — padding 40px */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px',           /* ← 40px all sides */
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '24px',               /* ← gap 24px */
      }}>

        {/* Column 1 — Brand + description */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Map size={18} color={T[500]} />
            <span style={{ color: T[50], fontWeight: 500, fontSize: '15px' }}>
              Indoor<span style={{ color: T[500] }}>Nav</span>
            </span>
          </div>
          <p style={{ color: T[300], fontSize: '13px', fontWeight: 400, lineHeight: 1.75, maxWidth: '300px', marginBottom: '16px' }}>
            A smart campus navigation system powered by the A* pathfinding algorithm.
            Built for Acropolis Institute of Technology and Research, Indore — Minor Project 2026.
          </p>
          <p style={{ color: T[600], fontSize: '13px', fontWeight: 400 }}>
            Guide: <span style={{ color: T[300], fontWeight: 500 }}>Prof. Ritika Bhatt</span>
          </p>
        </div>

        {/* Column 2 — Navigation links (center) */}
        <div>
          <span style={colLabel}>Navigation</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {NAV_LINKS.map(({ label, to }) => (
              <Link key={label} to={to} style={footerLink}
                onMouseEnter={e => e.currentTarget.style.color = T[50]}
                onMouseLeave={e => e.currentTarget.style.color = T[300]}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3 — Team / social (right) */}
        <div>
          <span style={colLabel}>Team</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TEAM.map(name => (
              <span key={name} style={{ color: T[300], fontSize: '13px', fontWeight: 400 }}>{name}</span>
            ))}
          </div>

          {/* Tags / social-style pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
            {['React', 'Spring Boot', 'A*'].map(tag => (
              <span key={tag} style={{
                color: T[600],
                border: `0.5px solid ${T[800]}`,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 400,
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div style={{ borderTop: `0.5px solid ${T[800]}`, padding: '16px 40px' }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '8px',
        }}>
          <p style={{ color: T[600], fontSize: '13px', fontWeight: 400, margin: 0 }}>
            © 2026 IndoorNav — Acropolis Institute of Technology and Research
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {['Home', 'Navigate', 'Sign In'].map((item, i) => (
              <Link key={i} to={['/', '/navigate', '/login'][i]}
                style={{ color: T[600], fontSize: '13px', textDecoration: 'none', fontWeight: 400, transition: 'color 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.color = T[300]}
                onMouseLeave={e => e.currentTarget.style.color = T[600]}>
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
