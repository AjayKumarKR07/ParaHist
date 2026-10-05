// Navbar.jsx — Public and Authenticated Navigation Bar with Dark/Light Theme Toggle
import { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart2, Cpu, BookOpen, Info, Compass,
  LogIn, UserPlus, LogOut, ChevronDown, User, Layers, Home as HomeIcon,
  Sun, Moon, Settings, Lock, Bell
} from 'lucide-react';
import { useTour } from '../context/TourContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { replayTour } = useTour();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  const authenticatedNavItems = [
    { to: '/',             label: 'Home',         icon: HomeIcon, id: 'nav-home' },
    { to: '/dashboard',    label: 'Dashboard',    icon: Activity, id: 'nav-dashboard' },
    { to: '/histogram',    label: 'Histogram',    icon: BarChart2, id: 'nav-histogram' },
    { to: '/performance',  label: 'Performance',  icon: Cpu, id: 'nav-performance' },
    { to: '/how-it-works', label: 'How It Works', icon: BookOpen, id: 'nav-how-it-works' },
    { to: '/about',        label: 'About',        icon: Info, id: 'nav-about' },
  ];

  const publicNavItems = [
    { to: '/',             label: 'Home',         icon: HomeIcon, id: 'nav-home' },
    { to: '/how-it-works', label: 'How It Works', icon: BookOpen, id: 'nav-how-it-works' },
    { to: '/about',        label: 'About',        icon: Info, id: 'nav-about' },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        gap: '0.75rem'
      }}>

        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>P</span>
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.1 }}>ParaHist</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>OpenMP · MNIST</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', overflowX: 'auto', padding: '0.2rem 0' }}>
          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
            {navItems.map(({ to, label, icon: Icon, id }) => (
              <NavLink
                key={to}
                to={to}
                id={id}
                end={to === '/' || to === '/dashboard'}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.75rem', borderRadius: 8,
                  textDecoration: 'none', fontSize: '0.84rem', fontWeight: 500,
                  color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                })}
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>

          {/* Guided Tour Trigger (Authenticated only) */}
          {isAuthenticated && (
            <button
              onClick={replayTour}
              className="btn btn-secondary"
              title="Start Guided Tour"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.78rem',
                gap: '0.35rem',
                borderColor: 'rgba(59,130,246,0.3)',
                color: 'var(--accent-light)',
                background: 'rgba(59,130,246,0.08)',
              }}
            >
              <Compass size={14} />
              <span className="hidden sm:inline">Guided Tour</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              padding: '0.35rem 0.65rem',
              fontSize: '0.78rem',
              gap: '0.35rem',
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: 8,
            }}
          >
            {theme === 'dark' ? (
              <>
                <Moon size={14} color="var(--accent-light)" />
                <span>Dark</span>
              </>
            ) : (
              <>
                <Sun size={14} color="var(--yellow)" />
                <span>Light</span>
              </>
            )}
          </button>

          {/* Profile Dropdown or Auth Links */}
          {isAuthenticated ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '0.35rem 0.65rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline">{user?.name || 'User'}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>

              {profileOpen && (
                <div
                  role="menu"
                  aria-label="User Account Menu"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 250,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-lg)',
                    padding: '0.6rem',
                    zIndex: 100,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setProfileOpen(false);
                  }}
                >
                  {/* User Profile Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0.5rem 0.5rem 0.75rem 0.5rem',
                    borderBottom: '1px solid var(--border)',
                    marginBottom: '0.35rem',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {user?.name || 'Researcher'}
                      </div>
                      <div style={{
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {user?.email || 'user@example.com'}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <Link
                      to="/account/profile"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <User size={15} color="var(--accent-light)" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/account/settings"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Settings size={15} color="var(--accent-light)" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      to="/account/security"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Lock size={15} color="var(--accent-light)" />
                      <span>Change Password</span>
                    </Link>

                    <Link
                      to="/account/notifications"
                      role="menuitem"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        textDecoration: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Bell size={15} color="var(--accent-light)" />
                      <span>Notifications</span>
                    </Link>
                  </div>

                  {/* Appearance Quick Switch */}
                  <div style={{
                    margin: '0.35rem 0',
                    paddingTop: '0.35rem',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => toggleTheme()}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {theme === 'dark' ? (
                          <Moon size={15} color="var(--accent-light)" />
                        ) : (
                          <Sun size={15} color="var(--yellow)" />
                        )}
                        <span>Appearance</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {theme}
                      </span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.35rem',
                  }}>
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--red)',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Link
                to="/login"
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <LogIn size={13} /> Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <UserPlus size={13} /> Get Started
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
}
