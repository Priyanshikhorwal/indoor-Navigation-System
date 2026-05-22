import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Map, Compass, Zap, Lock, CheckCircle, Navigation, Search, Cpu } from 'lucide-react';

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

// ── Shared helpers ────────────────────────────────────────────────────────────
const container = { maxWidth: '1200px', margin: '0 auto' };

const sectionLabel = {
  fontSize: '0.68rem',
  fontWeight: 500,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  marginBottom: '10px',
  display: 'block',
};

// Section wrapper — 60px top/bottom, 40px sides
const section = (bg) => ({
  backgroundColor: bg,
  padding: '60px 40px',
});

// ── Floor map (6×6) ───────────────────────────────────────────────────────────
const BASE_MAP = [
  [1, 1, 1, 1, 1, 1],
  [1, 3, 0, 0, 3, 1],
  [1, 0, 1, 0, 0, 1],
  [1, 0, 0, 1, 0, 1],
  [1, 3, 0, 0, 3, 1],
  [1, 1, 1, 1, 1, 1],
];

const PATH_STEPS = [
  [4,1],[3,1],[3,2],[3,3],[2,3],[1,3],[1,4],
];
const START = [4, 1];
const END   = [1, 4];

const CELL_BASE_COLOR = { 0: T[50], 1: T[900], 3: T[300] };

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '500+', label: 'Rooms Mapped' },
  { value: 'A*',   label: 'Algorithm' },
  { value: 'JWT',  label: 'Secured' },
  { value: '100%', label: 'Mobile Friendly' },
];

// ── How It Works Steps ────────────────────────────────────────────────────────
const STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Search Room',
    desc: 'Enter any classroom, laboratory, office, or facility inside our directory to identify it instantly.',
    iconColor: T[500],
    tileBg: T[50],
  },
  {
    step: '02',
    icon: Cpu,
    title: 'Calculate Route',
    desc: 'Our pathfinder computes the mathematically shortest cell-by-cell path using the optimized A* search algorithm.',
    iconColor: T[600],
    tileBg: '#e6f7f7',
  },
  {
    step: '03',
    icon: Navigation,
    title: 'Navigate',
    desc: 'Follow the live routing grid and step-by-step walkthrough to reach your destination effortlessly.',
    iconColor: T[800],
    tileBg: T[100],
  },
];

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Map,
    title: 'Interactive Maps',
    desc: 'Explore full building floor plans rendered as live grid layouts. Pan through corridors, identify rooms, labs and offices at a glance — all rendered in-browser with no external map service required.',
    tileBg: T[50],
    tileBorder: T[100],
    iconColor: T[500],
  },
  {
    icon: Compass,
    title: 'A* Algorithm',
    desc: 'Every route is computed using the A* heuristic search — guaranteed to return the mathematically shortest path. No approximations, no detours, just the optimal route every single time.',
    tileBg: '#e6f7f7',
    tileBorder: T[300],
    iconColor: T[600],
  },
  {
    icon: Zap,
    title: 'Fast & Responsive',
    desc: 'Built with a mobile-first layout that adapts fluidly to phones, tablets, and desktops. Pathfinding results appear in milliseconds — no loading spinners, no delays, no friction.',
    tileBg: T[100],
    tileBorder: T[300],
    iconColor: T[800],
  },
  {
    icon: Lock,
    title: 'Secure Admin',
    desc: 'Admins manage the entire floor map — add rooms, define walls, update routes — through a JWT-authenticated dashboard. Role-based access ensures only authorised personnel can make changes.',
    tileBg: T[900],
    tileBorder: T[800],
    iconColor: T[300],
  },
];

// ── Tech stack (grouped) ──────────────────────────────────────────────────────
const TECH = {
  Frontend:  ['React', 'Tailwind CSS'],
  Backend:   ['Spring Boot', 'Java', 'REST API'],
  Database:  ['PostgreSQL'],
  Security:  ['Spring Security', 'JWT'],
  Algorithm: ['A* Pathfinding'],
};

// ── Fade In Component ─────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(domRef.current);
        }
      });
    }, {
      threshold: 0.1,
    });
    
    const current = domRef.current;
    if (current) {
      observer.observe(current);
    }
    
    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Home = () => {
  const [litCells, setLitCells]   = useState(new Set());
  const [animDone, setAnimDone]   = useState(false);
  const [query, setQuery]         = useState('');
  const [highlightedRoom, setHighlightedRoom] = useState(null);

  const MINI_MAP_ROOMS = [
    { name: 'Physics Lab (Room 101)', coords: [1, 1] },
    { name: 'Chemistry Lab (Room 102)', coords: [1, 4] },
    { name: 'Computer Center (Room 103)', coords: [4, 1] },
    { name: 'Director\'s Office (Room 104)', coords: [4, 4] },
  ];

  const filteredRooms = query
    ? MINI_MAP_ROOMS.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const runAnim = () => {
    setLitCells(new Set());
    setAnimDone(false);
    let i = 0;
    const t = setInterval(() => {
      if (i < PATH_STEPS.length) {
        const key = `${PATH_STEPS[i][0]}-${PATH_STEPS[i][1]}`;
        setLitCells(prev => new Set([...prev, key]));
        i++;
      } else {
        clearInterval(t);
        setAnimDone(true);
      }
    }, 260);
  };

  useEffect(() => { runAnim(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getCellStyle = (r, c) => {
    const key     = `${r}-${c}`;
    const isStart = r === START[0] && c === START[1];
    const isEnd   = r === END[0]   && c === END[1];
    const isPath  = litCells.has(key) && !isStart && !isEnd;
    const base    = BASE_MAP[r][c];

    const isSearchMatch = query && filteredRooms.some(room => room.coords[0] === r && room.coords[1] === c);

    let bg = CELL_BASE_COLOR[base] ?? T[50];
    if (isStart)     bg = T[800];
    else if (isEnd)  bg = T[600];
    else if (isPath) bg = T[500];
    else if (isSearchMatch) bg = T[600]; // Highlight matched room with darker/active teal

    return {
      width: '46px', height: '46px', borderRadius: '4px',
      backgroundColor: bg,
      border: isSearchMatch ? `1.5px solid ${T[50]}` : (base === 0 && !isPath ? `0.5px solid ${T[100]}` : 'none'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background-color 0.22s ease, border-color 0.22s ease, transform 0.22s ease',
      transform: isSearchMatch ? 'scale(1.05)' : 'scale(1)',
    };
  };

  return (
    <div style={{ backgroundColor: T[50], minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .hero-grid > div:first-child {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .hero-map-wrapper {
            justify-content: center !important;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .stats-item {
            border-right: none !important;
            border-bottom: 0.5px solid #3d8b8b !important;
          }
          .stats-item:nth-child(odd) {
            border-right: 0.5px solid #3d8b8b !important;
          }
          .stats-item:nth-child(3), .stats-item:nth-child(4) {
            border-bottom: none !important;
          }
          .about-tech-grid {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .steps-grid, .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 375px) {
          .hero-grid {
            gap: 28px !important;
          }
          .hero-grid h1 {
            font-size: 26px !important;
          }
          section {
            padding: 40px 16px !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-item {
            border-right: none !important;
            border-bottom: 0.5px solid #3d8b8b !important;
          }
          .stats-item:nth-child(odd) {
            border-right: none !important;
          }
          .stats-item:last-child {
            border-bottom: none !important;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════ HERO */}
      <section style={{ backgroundColor: T[900], padding: '60px 40px' }}>
        <div className="hero-grid" style={{
          ...container,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '72px',
          alignItems: 'center',
        }}>

          {/* ── Left: copy ── */}
          <div>
            {/* Badge pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              border: `0.5px solid ${T[600]}`, borderRadius: '100px',
              padding: '5px 14px', marginBottom: '26px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: T[500] }} />
              <span style={{ color: T[300], fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.04em' }}>
                Smart Campus Navigation
              </span>
            </div>

            {/* H1 — 32px / weight 500 */}
            <h1 style={{
              color: T[50],
              fontSize: '32px',
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
              marginBottom: '18px',
            }}>
              Navigate Any Building<br />
              <span style={{ color: T[500] }}>Instantly &amp; Accurately</span>
            </h1>

            {/* Subtitle */}
            <p style={{
              color: T[300], fontSize: '14px', fontWeight: 400,
              lineHeight: 1.75, marginBottom: '24px', maxWidth: '420px',
            }}>
              Locate rooms, labs, offices, and departments inside large campuses
              using real-time shortest-path routing powered by the A* algorithm.
            </p>

            {/* Interactive Hero Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px', marginBottom: '32px', zIndex: 30 }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color={T[500]} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search a room, lab or office..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setHighlightedRoom(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '11px 16px 11px 40px',
                    border: '0.5px solid #8dd4d4',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: T[900],
                    fontSize: '14px',
                    fontWeight: 400,
                    outline: 'none',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#5aadad';
                    e.target.style.boxShadow = '0 0 0 2px rgba(90, 173, 173, 0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#8dd4d4';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {query && (
                <div style={{
                  position: 'absolute',
                  top: '100%', left: 0, right: 0,
                  backgroundColor: '#ffffff',
                  border: '0.5px solid #8dd4d4',
                  borderRadius: '8px',
                  marginTop: '4px',
                  zIndex: 40,
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}>
                  {filteredRooms.length === 0 ? (
                    <div style={{ padding: '10px 14px', fontSize: '13px', color: T[600] }}>No matching rooms found</div>
                  ) : (
                    filteredRooms.map(room => (
                      <div
                        key={room.name}
                        onMouseDown={() => {
                          setQuery(room.name);
                          setHighlightedRoom(room.coords);
                        }}
                        style={{
                          padding: '10px 14px',
                          fontSize: '13px',
                          color: T[900],
                          cursor: 'pointer',
                          borderBottom: `0.5px solid ${T[50]}`,
                          backgroundColor: highlightedRoom && highlightedRoom[0] === room.coords[0] && highlightedRoom[1] === room.coords[1] ? T[50] : '#ffffff',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = T[50]}
                        onMouseLeave={e => {
                          const isActive = highlightedRoom && highlightedRoom[0] === room.coords[0] && highlightedRoom[1] === room.coords[1];
                          e.currentTarget.style.backgroundColor = isActive ? T[50] : '#ffffff';
                        }}
                      >
                        {room.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/navigate"
                style={{
                  backgroundColor: T[500], color: T[50],
                  border: `0.5px solid ${T[600]}`, borderRadius: '8px',
                  padding: '11px 26px', fontWeight: 500, fontSize: '14px',
                  textDecoration: 'none', transition: 'background-color 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T[600]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = T[500]}>
                Start Navigating
              </Link>
              <Link to="/register"
                style={{
                  backgroundColor: 'transparent', color: T[100],
                  border: `0.5px solid ${T[300]}`, borderRadius: '8px',
                  padding: '11px 26px', fontWeight: 500, fontSize: '14px',
                  textDecoration: 'none', transition: 'background-color 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(93,173,173,0.12)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                Create Account
              </Link>
            </div>
          </div>

          {/* ── Right: animated floor-map (min 200px wide) ── */}
          <div className="hero-map-wrapper" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                border: `0.5px solid ${T[800]}`, borderRadius: '12px',
                padding: '24px', backgroundColor: T[800],
                minWidth: '300px',
                cursor: 'pointer',
              }}
              title="Hover to replay A* animation"
              onMouseEnter={runAnim}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: T[300], fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Floor B — Live Route
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Navigation size={10} color={T[500]} />
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    backgroundColor: animDone ? T[500] : T[300],
                    display: 'inline-block', transition: 'background-color 0.3s',
                  }} />
                </div>
              </div>

              {/* 6×6 grid — 46px cells */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 46px)',
                gridTemplateRows: 'repeat(6, 46px)',
                gap: '4px',
              }}>
                {BASE_MAP.map((row, ri) =>
                  row.map((_, ci) => {
                    const isStart = ri === START[0] && ci === START[1];
                    const isEnd   = ri === END[0]   && ci === END[1];
                    return (
                      <div key={`${ri}-${ci}`} style={getCellStyle(ri, ci)}>
                        {isStart && <span style={{ color: T[50], fontSize: '0.5rem', fontWeight: 500 }}>YOU</span>}
                        {isEnd   && <span style={{ color: T[50], fontSize: '0.5rem', fontWeight: 500 }}>DST</span>}
                        {!isStart && !isEnd && query && filteredRooms.some(room => room.coords[0] === ri && room.coords[1] === ci) && (
                          <span style={{ color: T[50], fontSize: '0.42rem', fontWeight: 500, letterSpacing: '0.01em' }}>MATCH</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                {[
                  { color: T[900], label: 'Wall' },
                  { color: T[500], label: 'A* Path' },
                  { color: T[300], label: 'Room' },
                  { color: T[800], label: 'Start/End' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: item.color, display: 'inline-block' }} />
                    <span style={{ color: T[300], fontSize: '0.62rem', fontWeight: 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <p style={{ color: T[600], fontSize: '0.6rem', fontWeight: 400, marginTop: '10px', textAlign: 'center', letterSpacing: '0.04em' }}>
                hover to replay
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════ STATS BAR */}
      <FadeIn>
        <section style={{ backgroundColor: T[800], borderTop: `0.5px solid ${T[600]}`, borderBottom: `0.5px solid ${T[600]}` }}>
          <div className="stats-grid" style={{ ...container, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {STATS.map((s, i) => (
              <div key={i} className="stats-item" style={{
                padding: '32px 24px', textAlign: 'center',
                borderRight: i < 3 ? `0.5px solid ${T[600]}` : 'none',
              }}>
                <div style={{ color: T[50], fontSize: '1.85rem', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ color: T[300], fontSize: '13px', fontWeight: 400, marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ══════════════════════════════════════════════════════════ HOW IT WORKS */}
      <section style={section('#ffffff')}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ ...sectionLabel, color: T[500] }}>Simple Process</span>
            <h2 style={{ color: T[900], fontSize: '22px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              How It Works
            </h2>
            <p style={{ color: T[600], fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
              Get to your destination room in three easy steps with live routing.
            </p>
          </div>

          {/* 3-step processes */}
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {STEPS.map(({ step, icon: Icon, title, desc, iconColor, tileBg }, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div
                  style={{
                    backgroundColor: T[50],
                    border: `0.5px solid ${T[100]}`,
                    borderRadius: '12px',
                    padding: '32px 24px',
                    minHeight: '200px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.18s, transform 0.18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T[300];
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T[100];
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Step Number Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    backgroundColor: T[100],
                    color: T[800],
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '100px',
                    padding: '3px 8px',
                    letterSpacing: '0.05em',
                  }}>
                    STEP {step}
                  </div>

                  {/* Icon Tile */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '9px',
                    backgroundColor: tileBg,
                    border: `0.5px solid ${T[100]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                  }}>
                    <Icon size={18} color={iconColor} />
                  </div>

                  <h3 style={{ color: T[900], fontSize: '14px', fontWeight: 500, marginBottom: '10px', marginTop: 0 }}>{title}</h3>
                  
                  <p style={{
                    color: T[600],
                    fontSize: '13px',
                    fontWeight: 400,
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════ FEATURES */}
      <section style={section(T[50])}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ ...sectionLabel, color: T[500] }}>What we offer</span>
            <h2 style={{ color: T[900], fontSize: '22px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              Key Features
            </h2>
          </div>

          {/* 4-column grid, 24px gap */}
          <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '24px' }}>
            {FEATURES.map(({ icon: Icon, title, desc, tileBg, tileBorder, iconColor }, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: `0.5px solid ${T[100]}`,
                    borderRadius: '12px',
                    padding: '28px 24px',
                    minHeight: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.18s, transform 0.18s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T[300];
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T[100];
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Icon tile — 40×40px */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '9px',
                    backgroundColor: tileBg, border: `0.5px solid ${tileBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '18px', flexShrink: 0,
                  }}>
                    <Icon size={18} color={iconColor} />
                  </div>

                  <h3 style={{ color: T[900], fontSize: '14px', fontWeight: 500, marginBottom: '10px', marginTop: 0 }}>{title}</h3>

                  {/* Description — 3-line clamp with ellipsis */}
                  <p style={{
                    color: T[600], fontSize: '13px', fontWeight: 400, lineHeight: 1.7,
                    margin: 0, flexGrow: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ ABOUT + TECH STACK */}
      <section style={{ ...section('#ffffff'), borderTop: `0.5px solid ${T[100]}` }}>
        <div style={container}>
          {/* 2-column, 24px gap */}
          <div className="about-tech-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'start' }}>

            {/* Left — About */}
            <div>
              <span style={{ ...sectionLabel, color: T[500] }}>About the Project</span>
              <h2 style={{ color: T[900], fontSize: '22px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px' }}>
                Built for Large Campus Environments
              </h2>
              {/* Body text — 14px, line-height 1.75 */}
              <p style={{ color: T[800], fontSize: '14px', fontWeight: 400, lineHeight: 1.75, marginBottom: '16px' }}>
                Indoor Navigation System for Buildings is a web-based platform designed to resolve the complexity of finding specific locations inside large infrastructures like college campuses — where visitors often struggle to locate the right room.
              </p>
              <p style={{ color: T[800], fontSize: '14px', fontWeight: 400, lineHeight: 1.75, marginBottom: '28px' }}>
                It leverages the A* search algorithm to compute the shortest possible route between a source and destination, providing a highly optimised pathfinding experience. The admin panel allows authorised staff to configure floor maps, rooms, and corridors in real-time.
              </p>

              {/* Callout box */}
              <div style={{
                backgroundColor: T[50],
                border: `0.5px solid ${T[100]}`,
                borderLeft: `3px solid ${T[500]}`,
                borderRadius: '8px',
                padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={15} color={T[500]} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ color: T[800], fontSize: '13px', fontWeight: 400, lineHeight: 1.7, margin: 0 }}>
                    Minor Project 2026 at{' '}
                    <span style={{ fontWeight: 500, color: T[900] }}>
                      Acropolis Institute of Technology and Research, Indore
                    </span>{' '}
                    — guided by Prof. Ritika Bhatt.
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Tech Stack */}
            <div>
              <span style={{ ...sectionLabel, color: T[500] }}>Technology Stack</span>
              <h2 style={{ color: T[900], fontSize: '22px', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '16px' }}>
                Built With Modern Tools
              </h2>
              <p style={{ color: T[800], fontSize: '14px', fontWeight: 400, lineHeight: 1.75, marginBottom: '28px' }}>
                A carefully selected stack built for performance, security, and maintainability across both frontend and backend layers.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {Object.entries(TECH).map(([group, techs]) => (
                  <div key={group}>
                    {/* Category label — #8dd4d4 */}
                    <p style={{
                      color: T[300],
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.13em',
                      marginBottom: '10px',
                    }}>
                      {group}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {techs.map(tech => (
                        <span key={tech}
                          style={{
                            backgroundColor: T[50],
                            border: `0.5px solid ${T[100]}`,
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: 400,
                            color: T[800],
                            transition: 'border-color 0.18s, color 0.18s',
                            cursor: 'default',
                          }}
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
      <section style={{
        backgroundColor: T[900],
        padding: '60px 24px',
        textAlign: 'center',
        borderTop: `0.5px solid ${T[800]}`,
      }}>
        <div style={container}>
          <span style={{ ...sectionLabel, color: T[300], display: 'block', textAlign: 'center' }}>
            Get Started Today
          </span>
          <h2 style={{
            color: T[50], fontSize: '24px', fontWeight: 500,
            letterSpacing: '-0.02em', marginBottom: '16px',
          }}>
            Ready to find your way?
          </h2>
          <p style={{
            color: T[300], fontSize: '14px', fontWeight: 400, lineHeight: 1.75,
            maxWidth: '440px', margin: '0 auto 36px',
          }}>
            Start navigating instantly — no app download required. Works right in your browser on any device.
          </p>
          {/* Centered buttons, gap: 16px */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/navigate"
              style={{
                backgroundColor: T[500], color: T[50],
                border: `0.5px solid ${T[600]}`, borderRadius: '8px',
                padding: '12px 28px', fontWeight: 500, fontSize: '14px',
                textDecoration: 'none', transition: 'background-color 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T[600]}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = T[500]}>
              Open Navigator
            </Link>
            <Link to="/register"
              style={{
                backgroundColor: 'transparent', color: T[100],
                border: `0.5px solid ${T[300]}`, borderRadius: '8px',
                padding: '12px 28px', fontWeight: 500, fontSize: '14px',
                textDecoration: 'none', transition: 'background-color 0.18s',
              }}
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
