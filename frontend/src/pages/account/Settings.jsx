// Settings.jsx — Laboratory Experiment and Application Preferences
import { useState, useEffect } from 'react';
import {
  Sun, Moon, Monitor, Cpu, BarChart2, Compass,
  CheckCircle2, AlertCircle, Save, Loader2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();

  // Load preferences from user context or default
  const [threads, setThreads] = useState(user?.preferences?.defaultThreads ?? 8);
  const [mode, setMode] = useState(user?.preferences?.defaultHistogramMode ?? 'both');
  const [guidedTour, setGuidedTour] = useState(user?.preferences?.guidedTour ?? true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep local state aligned with user context if refreshed
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.defaultThreads !== undefined) setThreads(user.preferences.defaultThreads);
      if (user.preferences.defaultHistogramMode) setMode(user.preferences.defaultHistogramMode);
      if (user.preferences.guidedTour !== undefined) setGuidedTour(user.preferences.guidedTour);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    try {
      setSaving(true);
      const payload = {
        theme,
        defaultThreads: Number(threads),
        defaultHistogramMode: mode,
        guidedTour: Boolean(guidedTour),
      };

      const res = await api.updatePreferences(payload);
      if (res && res.success && res.user) {
        updateUser(res.user);
        setSuccessMsg('Laboratory and application settings saved successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to update preferences.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Preferences
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Laboratory Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
          Configure appearance, computational defaults, and interactive onboarding.
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

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ── APPEARANCE SETTINGS ────────────────────────────────────────────── */}
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            General Appearance
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Select your preferred visual mode for the ParaHist research portal.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { id: 'dark',   label: 'Dark Mode',   icon: Moon,    desc: 'Deep navy laboratory' },
              { id: 'light',  label: 'Light Mode',  icon: Sun,     desc: 'Crisp academic white' },
              { id: 'system', label: 'System Mode', icon: Monitor, desc: 'Follow OS settings' },
            ].map(({ id, label, icon: Icon, desc }) => {
              const isSelected = theme === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setTheme(id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '1.1rem 0.9rem',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                    color: isSelected ? 'var(--accent-light)' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  <Icon size={22} color={isSelected ? 'var(--accent)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'inherit' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EXPERIMENT PREFERENCES ─────────────────────────────────────────── */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Experiment Preferences
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Default values used when launching OpenMP reduction runs on the MNIST dataset.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>

            {/* Default Threads */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                <Cpu size={14} color="var(--accent-light)" /> Default Thread Count
              </label>
              <select
                value={threads}
                onChange={(e) => setThreads(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                }}
              >
                <option value={1}>1 Thread (Sequential Baseline)</option>
                <option value={2}>2 Threads (Dual-Core)</option>
                <option value={4}>4 Threads (Quad-Core)</option>
                <option value={8}>8 Threads (Optimal Multi-Core)</option>
                <option value={16}>16 Threads (High-Concurrency)</option>
              </select>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Pre-selected whenever you open the Histogram Laboratory.
              </div>
            </div>

            {/* Default Histogram Mode */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                <BarChart2 size={14} color="var(--accent-light)" /> Default Histogram View
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'sequential', label: 'Sequential' },
                  { id: 'parallel',   label: 'Parallel' },
                  { id: 'both',       label: 'Both / Compare' },
                ].map(({ id, label }) => {
                  const isChecked = mode === id;
                  return (
                    <label
                      key={id}
                      style={{
                        flex: 1,
                        minWidth: 80,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '0.65rem 0.6rem',
                        borderRadius: 8,
                        border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                        background: isChecked ? 'rgba(59,130,246,0.12)' : 'var(--bg-secondary)',
                        color: isChecked ? 'var(--accent-light)' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="histMode"
                        value={id}
                        checked={isChecked}
                        onChange={() => setMode(id)}
                        style={{ display: 'none' }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>
                Active visualization mode upon completing engine execution.
              </div>
            </div>

          </div>
        </div>

        {/* ── GUIDED TOUR ONBOARDING ────────────────────────────────────────── */}
        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Interactive Guided Tour
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Control whether the interactive 10-step laboratory tour is enabled.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(59,130,246,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-light)',
              }}>
                <Compass size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Show First-Time Guided Walkthrough
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Highlight thread selection, C++ engine execution, and speedup analysis.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGuidedTour(!guidedTour)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                border: '1px solid',
                borderColor: guidedTour ? 'var(--green)' : 'var(--border)',
                background: guidedTour ? 'rgba(34,197,94,0.12)' : 'var(--bg-card)',
                color: guidedTour ? 'var(--green)' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {guidedTour ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* ── SAVE BUTTON ───────────────────────────────────────────────────── */}
        <div style={{ marginTop: '0.5rem' }}>
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
