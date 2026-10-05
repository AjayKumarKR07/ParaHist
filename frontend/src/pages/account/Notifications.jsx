// Notifications.jsx — Laboratory Experiment & System Notification Preferences
import { useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, AlertCircle, Save, Loader2,
  Activity, Cpu, ShieldCheck, Info, Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Notifications() {
  const { user, updateUser } = useAuth();

  const defaultNotifs = {
    experimentCompleted: true,
    benchmarkCompleted: true,
    correctnessResult: true,
    systemMessages: true,
    emailNotifications: false,
  };

  const [notifs, setNotifs] = useState(() => ({
    ...defaultNotifs,
    ...(user?.preferences?.notifications || {}),
  }));

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep state synced with user context
  useEffect(() => {
    if (user?.preferences?.notifications) {
      setNotifs({
        ...defaultNotifs,
        ...user.preferences.notifications,
      });
    }
  }, [user]);

  const toggleNotif = (key) => {
    setNotifs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setSaving(true);
      const res = await api.updatePreferences({
        notifications: notifs,
      });

      if (res && res.success && res.user) {
        updateUser(res.user);
        setSuccessMsg('Notification preferences updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to update notification settings.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving notifications.');
    } finally {
      setSaving(false);
    }
  };

  const items = [
    {
      key: 'experimentCompleted',
      title: 'Experiment Completed',
      desc: 'Show in-app notification when an OpenMP parallel reduction computation finishes.',
      icon: Activity,
    },
    {
      key: 'benchmarkCompleted',
      title: 'Benchmark Completed',
      desc: 'Notify when a multi-thread scalability benchmark (1 to 16 threads) finishes.',
      icon: Cpu,
    },
    {
      key: 'correctnessResult',
      title: 'Correctness Validation Alert',
      desc: 'Alert when 256-bin sequential vs parallel histogram comparison achieves 100% exact match.',
      icon: ShieldCheck,
    },
    {
      key: 'systemMessages',
      title: 'System & Engine Messages',
      desc: 'Receive alerts regarding WSL2 engine connectivity and C++ binary build status.',
      icon: Info,
    },
    {
      key: 'emailNotifications',
      title: 'Email Notifications',
      desc: 'Send computation summary reports to your registered email address.',
      icon: Mail,
    },
  ];

  return (
    <div>
      {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Alerts
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Notification Preferences
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
          Choose which laboratory computation events and system notifications you want to receive.
        </p>
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

      {/* ── NOTIFICATIONS FORM ──────────────────────────────────────────────── */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map(({ key, title, desc, icon: Icon }) => {
            const isEnabled = Boolean(notifs[key]);
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.15rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  gap: 16,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isEnabled ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
                    color: isEnabled ? 'var(--accent-light)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {desc}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleNotif(key)}
                  style={{
                    padding: '0.4rem 0.95rem',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: isEnabled ? 'var(--green)' : 'var(--border)',
                    background: isEnabled ? 'rgba(34,197,94,0.12)' : 'var(--bg-card)',
                    color: isEnabled ? 'var(--green)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0,
                  }}
                >
                  {isEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
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
                <Save size={16} /> Save Preferences
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
