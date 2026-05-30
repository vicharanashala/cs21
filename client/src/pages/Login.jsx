import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
    }}>
      {/* ── Left panel: brand ─────────────────────────────────── */}
      <div style={{
        width: '45%',
        minHeight: '100vh',
        background: '#0F0F23',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />

        {/* Geometric accent */}
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 260, height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)',
          opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', top: '30%', right: -40,
          width: 120, height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)',
          opacity: 0.2,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" fill="#4F46E5" />
            <rect x="12" y="12" width="16" height="16" rx="4" fill="#4F46E5" opacity="0.5" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>
            Crowd
          </span>
        </div>

        {/* Tagline */}
        <div style={{ position: 'relative' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.04em', lineHeight: 1.15,
            marginBottom: 14,
          }}>
            Your team's<br />
            knowledge, <span style={{ color: '#818CF8' }}>amplified.</span>
          </h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6, maxWidth: 280,
          }}>
            Crowd turns common questions into instant answers —
            powered by AI, refined by your team.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Instant AI-powered FAQ search',
              'Community-driven knowledge base',
              'Smart duplicate detection',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(79,70,229,0.3)',
                  border: '1px solid rgba(79,70,229,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', position: 'relative' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* ── Right panel: form ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--danger-bg)',
                border: '1px solid rgba(220,38,38,0.15)',
                color: 'var(--danger)',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <label className="label" style={{ marginBottom: 0 }}>Password</label>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', display: 'flex', alignItems: 'center',
                    padding: 4,
                    transition: 'color 0.15s',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: 40, fontSize: 14, marginTop: 4, justifyContent: 'center', gap: 8 }}
            >
              {loading && <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Sign up link */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            >
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div style={{
            marginTop: 24,
            padding: '12px 14px',
            borderRadius: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Demo accounts
            </p>
            {[
              { label: 'Admin', email: 'admin@crowd.faq' },
              { label: 'User', email: 'jane@example.com' },
            ].map(({ label, email }) => (
              <div key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginRight: 6, textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'monospace' }}>{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ email, password: 'password123' })}
                  style={{
                    fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none',
                    cursor: 'pointer', fontWeight: 500, padding: '2px 4px',
                  }}
                >
                  Use →
                </button>
              </div>
            ))}
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4, fontFamily: 'monospace' }}>
              password: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}