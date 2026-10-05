// Profile.jsx — User Profile Management
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep local state in sync if context user changes
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Format member since date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'October 2026';

  const initial = (name || user?.name || 'U').charAt(0).toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Full Name cannot be empty.');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMsg('Full Name must be at least 2 characters long.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateProfile({ name: name.trim() });
      if (res && res.success && res.user) {
        updateUser(res.user);
        setSuccessMsg('Your profile information has been successfully updated.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Account
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          My Profile
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
          View and update your personal information and laboratory credentials.
        </p>
      </div>

      {/* ── USER HERO BADGE ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        padding: '1.25rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        marginBottom: '2rem',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          fontWeight: 800,
          boxShadow: '0 6px 18px rgba(59,130,246,0.35)',
          flexShrink: 0,
        }}>
          {initial}
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {user?.name || 'Researcher'}
          </h3>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 2 }}>
            {user?.email || 'user@example.com'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span className="badge badge-blue">
              Role: {user?.role || 'Student'}
            </span>
            <span className="badge badge-green">
              Active Member
            </span>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION BANNERS ────────────────────────────────────────────── */}
      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0.75rem 1rem',
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 8,
          color: 'var(--green)',
          fontSize: '0.86rem',
          marginBottom: '1.5rem',
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0.75rem 1rem',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8,
          color: 'var(--red)',
          fontSize: '0.86rem',
          marginBottom: '1.5rem',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── PROFILE FORM ───────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Full Name */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <User size={14} color="var(--accent-light)" /> Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            style={{
              width: '100%',
              padding: '0.7rem 0.9rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Email Address (Read-only) */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Mail size={14} color="var(--accent-light)" /> Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            style={{
              width: '100%',
              padding: '0.7rem 0.9rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
              cursor: 'not-allowed',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Email address is your primary account identifier and cannot be modified.
          </div>
        </div>

        {/* Role & Member Since in 2-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              <Shield size={14} color="var(--accent-light)" /> Laboratory Role
            </label>
            <input
              type="text"
              value={user?.role || 'Student'}
              disabled
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              <Calendar size={14} color="var(--accent-light)" /> Member Since
            </label>
            <input
              type="text"
              value={memberSince}
              disabled
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                cursor: 'not-allowed',
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '0.7rem 1.6rem',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
