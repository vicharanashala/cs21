import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Loader } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
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
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, #4F46E5 0%, transparent 70%)',
          opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', top: '25%', right: -30,
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle, #059669 0%, transparent 70%)',
          opacity: 0.18,
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="4" fill="#4F46E5" />
            <rect x="12" y="12" width="16" height="16" rx="4" fill="#4F46E5" opacity="0.5" />
          </svg>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Crowd</span>
        </div>

        {/* Tagline */}
        <div style={{ position: 'relative' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 14,
          }}>
            Knowledge that<br />
            <span style={{ color: '#818CF8' }}>grows with you.</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>
            Every question your team asks becomes a building block.
            Crowd organizes it all — automatically.
          </p>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Build a searchable FAQ in minutes',
              'AI answers common questions instantly',
              'Track what needs to be added',
            ].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(79,70,229,0.3)',
                  border: '1px solid rgba(79,70,229,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', position: 'relative' }}>
          Free forever for small teams. No credit card required.
        </p>
      </div>

      {/* ── Right panel: form ──────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 6 }}>
              Create your account
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>
              Join your team's knowledge space
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.15)',
                color: 'var(--danger)', fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div>
              <label className="label">Full name</label>
              <input
                type="text" name="name" value={form.name} onChange={handleChange}
                className="input" placeholder="Alex Johnson" required minLength={2}
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                className="input" placeholder="alex@company.com" required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className="input" placeholder="At least 6 characters" required minLength={6}
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4,
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength hint */}
              <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                {[1,2,3].map(i => (
                  <div
                    key={i}
                    style={{
                      height: 3, flex: 1, borderRadius: 2,
                      background: form.password.length >= i * 2
                        ? i === 1 ? '#DC2626' : i === 2 ? '#D97706' : '#059669'
                        : 'var(--surface-2)',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
                <span style={{ fontSize: 10, color: 'var(--text-3)', alignSelf: 'center', marginLeft: 4 }}>
                  {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Good' : 'Strong'}
                </span>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: 40, fontSize: 14, marginTop: 4, justifyContent: 'center', gap: 8 }}
            >
              {loading && <Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Create account
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)', marginTop: 20 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}