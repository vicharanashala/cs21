import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import FAQCard from '../components/FAQCard'
import { Search, Loader, Plus, X, Sparkles } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const API = '/api'

const NEW_FAQ_HIGHLIGHT_MS = 30_000 // 30s purple glow for newly arrived AI FAQs

export default function FAQBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [faqs, setFaqs]               = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [pagination, setPagination]   = useState(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [newFaqIds, setNewFaqIds]     = useState(new Set()) // Recently created AI FAQ IDs

  const { addToast } = useToast()

  const search   = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort') || 'newest'
  const page     = parseInt(searchParams.get('page') || '1')

  // Load FAQ list (only re-runs on filter changes, not on new FAQ events)
  const loadFAQs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.set('search', search)
      if (category) params.set('category', category)
      if (sort)     params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '12')

      const res = await fetch(`${API}/faqs?${params}`)
      const data = await res.json()
      setFaqs(data.faqs || [])
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, page])

  useEffect(() => { loadFAQs() }, [loadFAQs])

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
  }, [])

  // ── Socket.io: listen for new AI FAQs ──────────────────────────────────────
  useEffect(() => {
    const handler = (event) => {
      const { type, faq } = event.detail || {}
      if (type !== 'ai_faq_created' || !faq?._id) return

      // Prepend new FAQ to the grid immediately (no full reload)
      setFaqs(prev => {
        // Avoid duplicates
        if (prev.some(f => f._id === faq._id)) return prev
        return [{ ...faq, isNew: true, _highlightUntil: Date.now() + NEW_FAQ_HIGHLIGHT_MS }, ...prev]
      })

      // Update pagination total if on page 1 with no filters blocking it
      setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : prev)

      // Mark as "new" — remove highlight after timeout
      setNewFaqIds(prev => {
        const next = new Set(prev)
        next.add(faq._id)
        return next
      })
      setTimeout(() => {
        setNewFaqIds(prev => {
          const next = new Set(prev)
          next.delete(faq._id)
          return next
        })
      }, NEW_FAQ_HIGHLIGHT_MS)

      // Toast notification
      addToast(
        <span>
          <Sparkles size={14} className="inline mr-1.5 text-purple-600" />
          <strong>New AI FAQ</strong> — {faq.category}: {faq.question.length > 60 ? faq.question.slice(0, 60) + '…' : faq.question}
        </span>,
        'ai',
        6000
      )
    }

    window.addEventListener('socket-activity', handler)
    return () => window.removeEventListener('socket-activity', handler)
  }, [addToast])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  const hasFilters = search || category || sort !== 'newest'

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FAQ Browser</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {pagination ? `${pagination.total} FAQs found` : 'Loading…'}
            {newFaqIds.size > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-purple-600 text-xs font-medium">
                <Sparkles size={11} /> {newFaqIds.size} new
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => updateFilter('search', e.target.value)}
              placeholder="Search FAQs..."
              className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-200 placeholder-gray-400"
            />
          </div>
          <select
            value={category}
            onChange={e => updateFilter('category', e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={e => updateFilter('sort', e.target.value)}
            className="input-field w-auto text-sm py-2"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="views">Most Viewed</option>
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* FAQ Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader size={24} className="animate-spin text-brand-600" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No FAQs found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters or be the first to add one!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {faqs.map(faq => (
            <FAQCard
              key={faq._id}
              faq={faq}
              isNew={newFaqIds.has(faq._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <button
              onClick={() => updateFilter('page', String(page - 1))}
              className="btn-secondary px-4 py-2 text-sm"
            >Previous</button>
          )}
          <span className="text-sm text-gray-500 px-4">
            Page {page} of {pagination.pages}
          </span>
          {page < pagination.pages && (
            <button
              onClick={() => updateFilter('page', String(page + 1))}
              className="btn-secondary px-4 py-2 text-sm"
            >Next</button>
          )}
        </div>
      )}

      {/* Create FAQ Modal */}
      {showCreate && (
        <CreateFAQModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadFAQs() }}
          categories={categories}
        />
      )}
    </div>
  )
}

// ── Create FAQ Modal ──────────────────────────────────────────────────────────
function CreateFAQModal({ onClose, onCreated, categories }) {
  const [form, setForm]     = useState({ question: '', answer: '', category: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tagList = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await fetch(`${API}/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...form, tags: tagList }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create FAQ')
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New FAQ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <input
              value={form.question}
              onChange={e => setForm({ ...form, question: e.target.value })}
              className="input-field"
              placeholder="What would you like to ask?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Answer</label>
            <textarea
              value={form.answer}
              onChange={e => setForm({ ...form, answer: e.target.value })}
              className="input-field resize-none"
              rows={4}
              placeholder="Provide a detailed answer…"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="input-field"
              required
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="input-field"
              placeholder="python, api, tutorial"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading && <Loader size={16} className="animate-spin" />} Submit FAQ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}