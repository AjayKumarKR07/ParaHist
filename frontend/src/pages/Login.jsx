// Login.jsx — User Login Page
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [welcomeMsg, setWelcomeMsg]     = useState(null);
  const [infoNotice, setInfoNotice]     = useState(location.state?.message || null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfoNotice(null);

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.success && res.user) {
        setWelcomeMsg(`Welcome back, ${res.user.name}.`);
        const targetPath = location.state?.from || '/dashboard';
        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 900);
      } else {
        setError(res?.message || 'Invalid email or password.');
      }
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
        setError('Authentication server is unavailable. Please check backend connection.');
      } else {
        setError(err.message || 'Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setInfoNotice('Password reset is not configured yet. Please contact the administrator.');
  };

  return (
    <div style={{ maxWidth: 440, margin: '4rem auto', padding: '0 1.5rem' }}>
      <div className="card" style={{ padding: '2.25rem 2rem', boxShadow: 'var(--shadow-lg)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <LogIn size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
            Sign in to continue to ParaHist.
          </p>
        </div>

        {/* Status alerts */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: 'var(--red)',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {infoNotice && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: 'var(--accent-light)',
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{infoNotice}</span>
          </div>
        )}

        {welcomeMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            color: 'var(--green)',
          }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>{welcomeMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Email */}
          <div>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrap}>
              <Mail size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
              <a
                href="#forgot"
                onClick={handleForgotPassword}
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                Forgot password?
              </a>
            </div>
            <div style={styles.inputWrap}>
              <Lock size={16} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <label htmlFor="remember" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Remember me
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 600, marginTop: '0.25rem' }}
          >
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 600 }}>
            Create Account
          </Link>
        </div>

      </div>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.65rem 2.4rem 0.65rem 2.4rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
};
