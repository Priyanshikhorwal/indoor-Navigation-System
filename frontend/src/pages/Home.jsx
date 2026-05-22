import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Compass, Zap, Lock, CheckCircle } from 'lucide-react';

// ── Teal Palette ─────────────────────────────────────────────────────────────
const T = {
  900: '#1a4a4a',
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

// ── Shared style helpers ──────────────────────────────────────────────────────
const sectionWrap = (bg = T[50]) => ({
  backgroundColor: bg,
  padding: '72px 1.5rem',
});

const container = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const label = {
  color: T[50],
  fontSize: '0.7rem',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

// ── Floor-map data (6×6) ──────────────────────────────────────────────────────
// 0=open, 1=wall, 2=path, 3=room, 4=current, 5=dest
const FLOOR_MAP = [
  [1, 1, 1, 1, 1, 1],
  [1, 3, 2, 2, 3, 1],
  [1, 0, 1, 0, 2, 1],
  [1, 2, 2, 1, 2, 1],
  [1, 4, 0, 1, 5, 1],
  [1, 1, 1, 1, 1, 1],
];

const CELL_COLORS = {
  0: T[50],       // open corridor
  1: T[900],      // wall
  2: T[500],      // path (A*)
  3: T[300],      // room
  4: '#2a6b6b',   // current position
  5: '#3d8b8b',   // destination
};

const CELL_LABELS = { 4: 'You', 5: 'Dst' };

// ── Stats data ────────────────────────────────────────────────────────────────
const STATS = [
  { value: '500+',  label: 'Rooms Mapped' },
  { value: 'A*',    label: 'Algorithm' },
  { value: 'JWT',   label: 'Secured' },
  { value: '100%',  label: 'Mobile Friendly' },
];

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Map,     title: 'Interactive Maps',  desc: 'View building layouts and room locations on a live floor grid.' },
  { icon: Compass, title: 'A* Algorithm',      desc: 'Finds the mathematically optimal shortest path every time.' },
  { icon: Zap,     title: 'Fast & Responsive', desc: 'Runs seamlessly on mobile, tablet, and desktop screens.' },
  { icon: Lock,    title: 'Secure Admin',       desc: 'JWT-authenticated dashboard for full map management.' },
];

// ── Tech stack chips ──────────────────────────────────────────────────────────
const TECH = {
  Frontend:  ['React', 'Tailwind CSS'],
  Backend:   ['Spring Boot', 'Java', 'REST API'],
  Database:  ['PostgreSQL'],
  Security:  ['Spring Security', 'JWT'],
  Algorithm: ['A* Pathfinding'],
};

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  return (
    <div style={{ backgroundColor: T[50], minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════════════ HERO */}
      <section style={{ backgroundColor: T[900], padding: '80px 1.5rem 72px' }}>
        <div style={{ ...container, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>

          {/* Left column */}
          <div>
            {/* Badge pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: `0.5px solid ${T[600]}`, borderRadius: '100px', padding: '5px 14px', marginBottom: '28px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: T[500] }} />
              <span style={{ color: T[300], fontSize: '0.75rem', fontWeight: 500 }}>Smart Campus Navigation</span>
            </div>

            {/* H1 */}
            <h1 style={{ color: T[50], fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 500, lineHeight: 1.2, marginBottom: '20px', letterSpacing: '-0.02em' }}>
              Navigate Any Building<br />
              <span style={{ color: T[500] }}>Instantly & Accurately</span>
            </h1>

            {/* Subtitle */}
            <p style={{ color: T[300], fontSize: '1rem', fontWeight: 400, lineHeight: 1.7, marginBottom: '36px', maxWidth: '440px' }}>
              Locate rooms, labs, offices, and departments inside large campuses using real-time shortest-path routing powered by the A* algorithm.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/navigate"
                style={{ backgroundColor: T[500], color: T[50], border: `0.5px solid ${T[600]}`, borderRadius: '8px', padding: '11px 26px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T[600]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = T[500]}>
                Start Navigating
              </Link>
              <Link to="/register"
                style={{ backgroundColor: 'transparent', color: T[100], border: `0.5px solid ${T[300]}`, borderRadius: '8px', padding: '11px 26px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(93,173,173,0.12)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                Create Account
              </Link>
            </div>
          </div>

          {/* Right column — 6×6 Floor Map */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ border: `0.5px solid ${T[800]}`, borderRadius: '12px', padding: '20px', backgroundColor: T[800], width: 'fit-content' }}>
              {/* Map label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ color: T[300], fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Floor B — Live Route</span>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: T[500], display: 'inline-block' }} />
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 44px)', gridTemplateRows: 'repeat(6, 44px)', gap: '4px' }}>
                {FLOOR_MAP.map((row, ri) =>
                  row.map((cell, ci) => (
                    <div key={`${ri}-${ci}`}
                      style={{
                        width: '44px', height: '44px', borderRadius: '4px',
                        backgroundColor: CELL_COLORS[cell],
                        border: cell === 0 ? `0.5px solid ${T[700] || T[800]}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'opacity 0.2s',
                      }}>
                      {CELL_LABELS[cell] && (
                        <span style={{ color: T[50], fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.04em' }}>
                          {CELL_LABELS[cell]}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '14px', marginTop: '14px', flexWrap: 'wrap' }}>
                {[
                  { color: T[900], label: 'Wall' },
                  { color: T[500], label: 'Path' },
                  { color: T[300], label: 'Room' },
                  { color: T[800], label: 'You' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color, display: 'inline-block' }} />
                    <span style={{ color: T[300], fontSize: '0.65rem', fontWeight: 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ STATS BAR */}
      <section style={{ backgroundColor: T[800], borderTop: `0.5px solid ${T[600]}`, borderBottom: `0.5px solid ${T[600]}` }}>
        <div style={{ ...container, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              padding: '28px 16px', textAlign: 'center',
              borderRight: i < 3 ? `0.5px solid ${T[600]}` : 'none',
            }}>
              <div style={{ color: T[50], fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 500, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ color: T[300], fontSize: '0.78rem', fontWeight: 400, marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ FEATURES */}
      <section style={sectionWrap(T[50])}>
        <div style={container}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ ...label, color: T[500], marginBottom: '10px' }}>What we offer</p>
            <h2 style={{ color: T[900], fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 500, letterSpacing: '-0.02em' }}>
              Key Features
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <div key={i}
                style={{ backgroundColor: '#ffffff', border: `0.5px solid ${T[100]}`, borderRadius: '12px', padding: '28px 24px', transition: 'border-color 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T[300]}
                onMouseLeave={e => e.currentTarget.style.borderColor = T[100]}>
                {/* Icon tile */}
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: T[50], border: `0.5px solid ${T[100]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
                  <Icon size={20} color={T[500]} />
                </div>
                <h3 style={{ color: T[900], fontSize: '1rem', fontWeight: 500, marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: T[600], fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ ABOUT + TECH STACK */}
      <section style={sectionWrap('#ffffff')}>
        <div style={{ ...container, borderTop: `0.5px solid ${T[100]}`, paddingTop: '72px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>

            {/* Left — About */}
            <div>
              <p style={{ ...label, color: T[500], marginBottom: '10px' }}>About the Project</p>
              <h2 style={{ color: T[900], fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '20px' }}>
                Built for Large Campus Environments
              </h2>
              <p style={{ color: T[800], fontSize: '0.9rem', fontWeight: 400, lineHeight: 1.75, marginBottom: '16px' }}>
                Indoor Navigation System for Buildings is a web-based platform designed to resolve the complexity of finding specific locations inside large infrastructures like college campuses.
              </p>
              <p style={{ color: T[800], fontSize: '0.9rem', fontWeight: 400, lineHeight: 1.75, marginBottom: '28px' }}>
                It leverages the A* search algorithm to compute the shortest possible route between a source and a destination, providing a highly optimised pathfinding experience.
              </p>

              {/* Highlight callout box */}
              <div style={{ backgroundColor: T[50], border: `0.5px solid ${T[100]}`, borderLeft: `3px solid ${T[500]}`, borderRadius: '8px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} color={T[500]} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ color: T[800], fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.65, margin: 0 }}>
                    Designed as a Minor Project 2026 at <strong style={{ fontWeight: 500, color: T[900] }}>Acropolis Institute of Technology and Research, Indore</strong> — guided by Prof. Ritika Bhatt.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Tech Stack */}
            <div>
              <p style={{ ...label, color: T[500], marginBottom: '10px' }}>Technology Stack</p>
              <h2 style={{ color: T[900], fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '28px' }}>
                Built With Modern Tools
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.entries(TECH).map(([group, techs]) => (
                  <div key={group}>
                    <p style={{ color: T[600], fontSize: '0.72rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{group}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {techs.map(tech => (
                        <span key={tech}
                          style={{ backgroundColor: T[50], border: `0.5px solid ${T[100]}`, borderRadius: '8px', padding: '5px 14px', fontSize: '0.8rem', fontWeight: 400, color: T[800], transition: 'border-color 0.18s, color 0.18s', cursor: 'default' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = T[500]; e.currentTarget.style.color = T[900]; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = T[100]; e.currentTarget.style.color = T[800]; }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ CTA */}
      <section style={{ backgroundColor: T[900], padding: '80px 1.5rem', textAlign: 'center' }}>
        <div style={container}>
          <p style={{ ...label, color: T[300], marginBottom: '12px' }}>Get Started Today</p>
          <h2 style={{ color: T[50], fontSize: 'clamp(1.6rem, 3.5vw, 2.25rem)', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '14px' }}>
            Ready to find your way?
          </h2>
          <p style={{ color: T[300], fontSize: '0.95rem', fontWeight: 400, marginBottom: '36px', maxWidth: '480px', margin: '0 auto 36px' }}>
            Start navigating instantly — no app download required. Works right in your browser.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/navigate"
              style={{ backgroundColor: T[500], color: T[50], border: `0.5px solid ${T[600]}`, borderRadius: '8px', padding: '12px 28px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T[600]}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = T[500]}>
              Open Navigator
            </Link>
            <Link to="/register"
              style={{ backgroundColor: 'transparent', color: T[100], border: `0.5px solid ${T[300]}`, borderRadius: '8px', padding: '12px 28px', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', transition: 'background 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(93,173,173,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              Register Free
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
