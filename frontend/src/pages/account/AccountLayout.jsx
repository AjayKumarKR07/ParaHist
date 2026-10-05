// AccountLayout.jsx — Clean, academic Account Center shell
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { User, Settings, Shield, Bell, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/account/profile',       label: 'My Profile',      icon: User,     desc: 'Personal information & role' },
    { to: '/account/settings',      label: 'Settings',        icon: Settings, desc: 'Appearance & experiment defaults' },
    { to: '/account/security',      label: 'Security',        icon: Shield,   desc: 'Password & account protection' },
    { to: '/account/notifications', label: 'Notifications',   icon: Bell,     desc: 'Laboratory experiment alerts' },
  ];

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '2.5rem 1.5rem 5rem 1.5rem' }}>

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '0.25rem 0.75rem',
          borderRadius: 999,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
          marginBottom: '0.65rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Account Center
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.3rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
          Account Management
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Manage your researcher profile, laboratory execution preferences, and credentials.
        </p>
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.75rem',
        alignItems: 'start',
      }}>

        {/* ── SIDEBAR NAVIGATION ────────────────────────────────────────────── */}
        <aside style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '1.25rem',
          boxShadow: 'var(--shadow-lg)',
        }}>
          {/* User mini badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingBottom: '1rem',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
            }}>
              {initial}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name || 'Researcher'}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.email || 'user@example.com'}
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  {user?.role || 'Student'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {navItems.map(({ to, label, icon: Icon, desc }) => {
              const isActive = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '0.75rem 0.9rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    color: isActive ? 'var(--accent-light)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: isActive ? 700 : 600 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                      {desc}
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ── PAGE CONTENT CARD ─────────────────────────────────────────────── */}
        <section style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '2rem 1.75rem',
          boxShadow: 'var(--shadow-lg)',
          minWidth: 0,
        }}>
          <Outlet />
        </section>

      </div>

    </div>
  );
}
