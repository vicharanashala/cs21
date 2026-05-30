import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Crowd</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h1>
          <p className="text-gray-500 mt-1">
            {sent
              ? "Check your inbox — you're almost there"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle size={48} className="text-green-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                If <strong>{email}</strong> is registered with us, we've sent a password reset link.
                Check your inbox (and spam folder) — the link expires in <strong>60 minutes</strong>.
              </p>
              <p className="text-sm text-gray-400">
                Didn't get an email?{' '}
                <button onClick={() => setSent(false)} className="text-brand-600 hover:underline font-medium">
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : null}
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {!sent && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Remember your password?{' '}
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}