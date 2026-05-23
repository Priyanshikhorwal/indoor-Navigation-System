import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Map, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        navigate('/');
    };

    // ── Palette constants (flat — no gradients, no shadows) ──────────────────
    const NAV_BG   = '#1a4a4a';   // darkest teal
    const TEXT_MID = '#8dd4d4';   // mid-light — nav links
    const TEXT_LT  = '#eaf7f7';   // lightest — logo / active
    const BORDER   = '#2a6b6b';   // dark border
    const BTN_MID  = '#5aadad';   // solid button fill

    const navLinkStyle = {
        color: TEXT_MID,
        fontWeight: 500,
        fontSize: '0.875rem',
        textDecoration: 'none',
        transition: 'color 0.18s',
        padding: '4px 0',
    };

    const ghostBtnStyle = {
        color: TEXT_LT,
        border: `0.5px solid ${TEXT_MID}`,
        borderRadius: '8px',
        padding: '7px 18px',
        fontSize: '0.8rem',
        fontWeight: 500,
        textDecoration: 'none',
        background: 'transparent',
        transition: 'background 0.18s',
        cursor: 'pointer',
    };

    const solidBtnStyle = {
        color: '#eaf7f7',
        background: BTN_MID,
        border: `0.5px solid #3d8b8b`,
        borderRadius: '8px',
        padding: '7px 18px',
        fontSize: '0.8rem',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'background 0.18s',
        cursor: 'pointer',
    };

    const logoutBtnStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#c4eaea',
        border: `0.5px solid #3d8b8b`,
        borderRadius: '8px',
        padding: '7px 14px',
        fontSize: '0.8rem',
        fontWeight: 500,
        background: 'transparent',
        transition: 'background 0.18s',
        cursor: 'pointer',
    };

    return (
        <nav style={{ background: NAV_BG, borderBottom: `0.5px solid ${BORDER}`, position: 'sticky', top: 0, zIndex: 50 }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>

                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <Map size={20} color={BTN_MID} />
                    <span style={{ color: TEXT_LT, fontWeight: 500, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                        Indoor<span style={{ color: BTN_MID }}>Nav</span>
                    </span>
                </Link>

                {/* Desktop links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
                    <Link to="/" style={navLinkStyle} onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = TEXT_MID}>Home</Link>
                    <Link to="/navigate" style={navLinkStyle} onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = TEXT_MID}>Navigation</Link>
                    <Link to="/about" style={navLinkStyle} onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = TEXT_MID}>About</Link>

                    {token ? (
                        <>
                            {role === 'ROLE_ADMIN'
                                ? <Link to="/admin/dashboard" style={navLinkStyle} onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = TEXT_MID}>Admin Panel</Link>
                                : <Link to="/user-dashboard" style={navLinkStyle} onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = TEXT_MID}>Dashboard</Link>
                            }
                            <span style={{ color: TEXT_MID, fontSize: '0.75rem', border: `0.5px solid #2a6b6b`, borderRadius: '6px', padding: '4px 10px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={email}>{email}</span>
                            <button onClick={handleLogout} style={logoutBtnStyle}
                                onMouseEnter={e => e.currentTarget.style.background = '#2a6b6b'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <LogOut size={13} /><span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link to="/login" style={ghostBtnStyle}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(93,173,173,0.1)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                Sign In
                            </Link>
                            <Link to="/register" style={solidBtnStyle}
                                onMouseEnter={e => e.currentTarget.style.background = '#3d8b8b'}
                                onMouseLeave={e => e.currentTarget.style.background = BTN_MID}>
                                Register
                            </Link>
                            <Link to="/admin/login" style={{ ...navLinkStyle, fontSize: '0.75rem', color: '#5aadad' }}
                                onMouseEnter={e => e.target.style.color = TEXT_LT} onMouseLeave={e => e.target.style.color = '#5aadad'}>
                                Admin
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MID, display: 'none' }}
                    className="show-mobile"
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div style={{ background: '#1a4a4a', borderTop: `0.5px solid ${BORDER}`, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <Link to="/" style={{ ...navLinkStyle, color: TEXT_LT }} onClick={() => setMobileOpen(false)}>Home</Link>
                    <Link to="/navigate" style={{ ...navLinkStyle, color: TEXT_LT }} onClick={() => setMobileOpen(false)}>Navigation</Link>
                    <Link to="/about" style={{ ...navLinkStyle, color: TEXT_LT }} onClick={() => setMobileOpen(false)}>About</Link>
                    {!token && (
                        <>
                            <Link to="/login" style={{ ...navLinkStyle, color: TEXT_MID }} onClick={() => setMobileOpen(false)}>Sign In</Link>
                            <Link to="/register" style={{ ...solidBtnStyle, textAlign: 'center' }} onClick={() => setMobileOpen(false)}>Register</Link>
                            <Link to="/admin/login" style={{ ...navLinkStyle, color: '#5aadad' }} onClick={() => setMobileOpen(false)}>Admin</Link>
                        </>
                    )}
                    {token && (
                        <button onClick={() => { handleLogout(); setMobileOpen(false); }} style={{ ...logoutBtnStyle, justifyContent: 'center' }}>
                            <LogOut size={13} /><span>Logout</span>
                        </button>
                    )}
                </div>
            )}

            {/* Inline mobile breakpoint helpers */}
            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile   { display: block !important; }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
