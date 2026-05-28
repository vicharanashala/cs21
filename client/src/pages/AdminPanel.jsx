import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Loader, Users, BookOpen, MessageSquare, FolderOpen, Shield, Trash2, Github } from 'lucide-react'
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../config/github'

const API = '/api'

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    loadStats()
  }, [user])

  const loadStats = async () => {
    try {
      const res = await fetch(`${API}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const data = await res.json()
      setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFAQ = async (id) => {
    if (!confirm('Delete this FAQ?')) return
    setDeletingId(id)
    try {
      await fetch(`${API}/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      loadStats()
    } finally {
      setDeletingId(null)
    }
  }

  if (user?.role !== 'admin') return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size={24} className="animate-spin text-brand-600" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total FAQs', value: stats?.faqCount, icon: BookOpen, color: 'text-brand-600' },
    { label: 'Total Users', value: stats?.userCount, icon: Users, color: 'text-violet-600' },
    { label: 'Total Chats', value: stats?.chatCount, icon: MessageSquare, color: 'text-orange-600' },
    { label: 'Categories', value: stats?.categoryCount, icon: FolderOpen, color: 'text-emerald-600' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-violet-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage your Crowd portal</p>
        </div>
        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg"
        >
          <Github size={14} />
          <span>{GITHUB_USERNAME}</span>
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Recent FAQs */}
      {stats?.recentFAQs?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent FAQs</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Question</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Author</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Votes</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentFAQs.map(faq => (
                  <tr key={faq._id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-white max-w-xs truncate">{faq.question}</td>
                    <td className="px-5 py-3">
                      <span className="badge">{faq.category}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{faq.user?.name}</td>
                    <td className="px-5 py-3 text-gray-500">{faq.votes}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDeleteFAQ(faq._id)}
                        disabled={deletingId === faq._id}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        {deletingId === faq._id
                          ? <Loader size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}