import React from 'react';
import { Github, Linkedin, Cpu, Layers, Layout, ShieldCheck, Database, Compass } from 'lucide-react';

const T = {
  900: '#1a4a4a',
  800: '#2a6b6b',
  600: '#3d8b8b',
  500: '#5aadad',
  300: '#8dd4d4',
  100: '#c4eaea',
  50:  '#eaf7f7',
};

const TEAM_MEMBERS = [
  {
    name: 'Prabhat Kumar Ahirwar',
    role: 'Backend Architect / API Design',
    initials: 'PA',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Priyanshi Khorwal',
    role: 'Frontend Lead / UI Designer',
    initials: 'PK',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Nital Agrawal',
    role: 'Algorithm Specialist / Route Analyst',
    initials: 'NA',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Nitin Patidar',
    role: 'Full Stack Engineer / Database Admin',
    initials: 'NP',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
];

const TECH_STACK = {
  Frontend: {
    icon: Layout,
    items: ['React', 'Tailwind CSS'],
  },
  Backend: {
    icon: Layers,
    items: ['Spring Boot', 'Java', 'REST API'],
  },
  Database: {
    icon: Database,
    items: ['PostgreSQL'],
  },
  Security: {
    icon: ShieldCheck,
    items: ['Spring Security', 'JWT'],
  },
  Algorithm: {
    icon: Compass,
    items: ['A* Pathfinding'],
  },
};

const About = () => {
  return (
    <div className="about-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @media (max-width: 768px) {
          .about-team-grid {
            grid-template-columns: 1fr !important;
          }
          .about-page-wrapper section {
            padding: 40px 24px !important;
          }
        }
        @media (max-width: 375px) {
          .about-page-wrapper section {
            padding: 30px 16px !important;
          }
        }
      `}</style>
      
      {/* Section 1: Project Intro */}
      <section style={{
        backgroundColor: T[900],
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            color: T[50],
            fontSize: '32px',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            margin: '0 0 16px 0',
          }}>
            About Indoor Nav
          </h1>
          <p style={{
            color: T[300],
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: 1.7,
            margin: 0,
          }}>
            Indoor Navigation System for Buildings is a web platform designed to resolve the complexity of finding specific locations inside large infrastructures. By combining an elegant interactive grid blueprint with mathematically verified A* routing, visitors can locate and navigate directly to rooms, offices, and classrooms seamlessly.
          </p>
        </div>
      </section>

      {/* Section 2: Team Grid */}
      <section style={{
        backgroundColor: T[50],
        padding: '60px 24px',
        borderBottom: `0.5px solid ${T[100]}`,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: T[600],
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              display: 'block',
              marginBottom: '8px',
            }}>
              Development Team
            </span>
            <h2 style={{
              color: T[900],
              fontSize: '22px',
              fontWeight: 500,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Meet Our Members
            </h2>
          </div>

          <div className="about-team-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {TEAM_MEMBERS.map((member, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#ffffff',
                  border: `0.5px solid ${T[100]}`,
                  borderRadius: '12px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: 'none',
                  transition: 'border-color 0.15s, transform 0.15s',
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
                {/* Initials Avatar Circle */}
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: T[800],
                  color: T[100],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 500,
                  userSelect: 'none',
                }}>
                  {member.initials}
                </div>

                {/* Name */}
                <h3 style={{
                  color: T[900],
                  fontSize: '15px',
                  fontWeight: 500,
                  marginTop: '16px',
                  marginBottom: '6px',
                }}>
                  {member.name}
                </h3>

                {/* Role */}
                <span style={{
                  color: T[500],
                  fontSize: '13px',
                  fontWeight: 400,
                  marginBottom: '20px',
                  display: 'block',
                }}>
                  {member.role}
                </span>

                {/* GitHub + LinkedIn Icon Links */}
                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T[600],
                      transition: 'color 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = T[800]}
                    onMouseLeave={e => e.currentTarget.style.color = T[600]}
                    aria-label="GitHub profile link"
                  >
                    <Github size={18} />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: T[600],
                      transition: 'color 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = T[800]}
                    onMouseLeave={e => e.currentTarget.style.color = T[600]}
                    aria-label="LinkedIn profile link"
                  >
                    <Linkedin size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Tech Stack Summary */}
      <section style={{
        padding: '60px 24px',
        backgroundColor: '#ffffff',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: T[500],
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              display: 'block',
              marginBottom: '8px',
            }}>
              System Architecture
            </span>
            <h2 style={{
              color: T[900],
              fontSize: '22px',
              fontWeight: 500,
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              Technology Stack Summary
            </h2>
          </div>

          {/* Centered Single Card */}
          <div style={{
            backgroundColor: '#ffffff',
            border: `0.5px solid ${T[100]}`,
            borderRadius: '12px',
            padding: '40px',
            boxShadow: 'none',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(TECH_STACK).map(([category, details]) => {
                const Icon = details.icon;
                return (
                  <div
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      borderBottom: category !== 'Algorithm' ? `0.5px solid ${T[50]}` : 'none',
                      paddingBottom: category !== 'Algorithm' ? '20px' : '0',
                    }}
                  >
                    {/* Icon Container */}
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: T[50],
                      border: `0.5px solid ${T[100]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={T[600]} />
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{
                        color: T[900],
                        fontSize: '13px',
                        fontWeight: 500,
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {category}
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {details.items.map(tech => (
                          <span
                            key={tech}
                            style={{
                              backgroundColor: T[50],
                              border: `0.5px solid ${T[100]}`,
                              borderRadius: '6px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 400,
                              color: T[800],
                              cursor: 'default',
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
