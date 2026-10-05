// Security.jsx — Account Password & Credential Security
import { useState } from 'react';
import {
  Shield, Key, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, Save, Loader2, ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';

export default function Security() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('New password cannot be the same as your current password.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (res && res.success) {
        setSuccessMsg('Your password has been changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while updating password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* ── SECTION HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Security
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Change Password
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: 4 }}>
          Keep your ParaHist laboratory account secure by using a strong password.
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

      {/* ── CHANGE PASSWORD FORM ────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 480 }}>

        {/* Current Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Key size={14} color="var(--accent-light)" /> Current Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem 0.7rem 0.9rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Lock size={14} color="var(--accent-light)" /> New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem 0.7rem 0.9rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Must contain at least 8 characters.
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            <Lock size={14} color="var(--accent-light)" /> Confirm New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem 0.7rem 0.9rem',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Security Rules Box */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '0.85rem 1rem',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 4 }}>
            <ShieldCheck size={14} /> Password Policy:
          </div>
          <div>• Password must be at least 8 characters in length.</div>
          <div>• Hashed using industry-standard bcrypt with cryptographic salt.</div>
          <div>• Never stored in plaintext or exposed in API responses.</div>
        </div>

        {/* Submit Button */}
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
                <Loader2 size={16} className="animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Save size={16} /> Update Password
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
