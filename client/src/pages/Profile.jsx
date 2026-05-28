import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Loader, Save, Github } from 'lucide-react'
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../config/github'

const API = '/api'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: form.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user?.role === 'admin'
                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {success && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm">{success}</div>}
          {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input
              type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" required minLength={2} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input type="email" value={user?.email} className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed" disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Loader size={16} className="animate-spin" />}
            <Save size={16} /> Save Changes
          </button>
        </form>
      </div>

      <div className="card p-6 border-red-200 dark:border-red-900/50">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Danger Zone</h3>
        <p className="text-sm text-gray-500 mb-4">Once you delete your account, there is no going back.</p>
        <button
          onClick={() => alert('Account deletion is disabled in the MVP demo.')}
          className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Delete Account
        </button>

      {/* GitHub Integration */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">GitHub Integration</h3>
        <p className="text-sm text-gray-500 mb-4">Connected GitHub developer profile</p>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Github size={20} className="text-gray-700 dark:text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{GITHUB_USERNAME}</p>
              <p className="text-xs text-gray-400">Developer Profile</p>
            </div>
          </div>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs px-3 py-1.5"
          >
            View Profile ↗
          </a>
        </div>
      </div>
      </div>
    </div>
  )
}