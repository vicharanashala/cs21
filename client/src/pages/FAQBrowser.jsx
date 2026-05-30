import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import FAQCard from '../components/FAQCard'
import { Search, Loader, Plus, X, Sparkles, Globe, ChevronDown } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const API = '/api'
const NEW_FAQ_HIGHLIGHT_MS = 30_000

const LANGUAGES = [
  { code: 'en', name: 'English',    native: 'English',    flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Spanish',    native: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French',     native: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic',     native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: 'Chinese',    native: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', name: 'German',     native: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português',  flag: '🇧🇷', dir: 'ltr' },
]

export default function FAQBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [faqs, setFaqs]               = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [pagination, setPagination]   = useState(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [newFaqIds, setNewFaqIds]     = useState(new Set())
  const [lang, setLang]               = useState(() => localStorage.getItem('faq_lang') || 'en')
  const [langOpen, setLangOpen]       = useState(false)

  const { addToast } = useToast()

  const search   = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort') || 'newest'
  const page     = parseInt(searchParams.get('page') || '1')
  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  const selectLang = (code) => {
    setLang(code)
    localStorage.setItem('faq_lang', code)
    setLangOpen(false)
  }

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    const close = (e) => { if (!e.target.closest('.lang-selector')) setLangOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [langOpen])

  const loadFAQs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)   params.set('search', search)
      if (category) params.set('category', category)
      if (sort)     params.set('sort', sort)
      params.set('page', String(page))
      params.set('limit', '12')
      params.set('lang', lang)
      const res = await fetch(`${API}/faqs?${params}`)
      const data = await res.json()
      setFaqs(data.faqs || [])
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, page, lang])

  useEffect(() => { loadFAQs() }, [loadFAQs])

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
  }, [])

  useEffect(() => {
    const handler = (event) => {
      const { type, faq } = event.detail || {}
      if (type !== 'ai_faq_created' || !faq?._id) return
      setFaqs(prev => {
        if (prev.some(f => f._id === faq._id)) return prev
        return [{ ...faq, isNew: true }, ...prev]
      })
      setPagination(prev => prev ? { ...prev, total: prev.total + 1 } : prev)
      setNewFaqIds(prev => { const n = new Set(prev); n.add(faq._id); return n })
      setTimeout(() => setNewFaqIds(prev => { const n = new Set(prev); n.delete(faq._id); return n }), NEW_FAQ_HIGHLIGHT_MS)
      addToast(
        <span>
          <Sparkles size={13} style={{ display: 'inline', marginRight: 5, color: '#7C3AED' }} />
          <strong>New AI FAQ</strong> — {faq.category}
        </span>, 'ai', 6000
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
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            FAQ Browser
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {pagination ? `${pagination.total.toLocaleString()} FAQs found` : 'Loading…'}
            {newFaqIds.size > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#7C3AED', fontWeight: 600 }}>
                · {newFaqIds.size} new
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Language selector */}
          <div className="lang-selector" style={{ position: 'relative' }}>
            <button
              onClick={() => setLangOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '0 12px', height: 34,
                fontSize: 12, fontWeight: 500, color: 'var(--text)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'border-color 0.15s',
                minWidth: 120,
              }}
            >
              <Globe size={13} style={{ color: 'var(--accent)' }} />
              <span>{currentLang.flag} {currentLang.native}</span>
              <ChevronDown size={11} style={{ color: 'var(--text-3)', marginLeft: 'auto' }} />
            </button>

            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden', zIndex: 200, minWidth: 160,
              }}>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => selectLang(l.code)}
                    dir={l.dir}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '9px 14px',
                      background: l.code === lang ? 'var(--accent-dim)' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      fontSize: 12, fontWeight: l.code === lang ? 600 : 400,
                      color: l.code === lang ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer', fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background = 'var(--surface-2)' }}
                    onMouseLeave={e => { if (l.code !== lang) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 15 }}>{l.flag}</span>
                    <span>{l.native}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)' }}>{l.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8, padding: '0 14px', height: 34,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', boxShadow: '0 1px 2px rgba(79,70,229,0.2)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <Plus size={14} /> Add FAQ
          </button>
        </div>
      </div>

      {/* ── Filter bar ─────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 14px',
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 7,
          padding: '0 12px', height: 34, flex: 1, minWidth: 160,
        }}>
          <Search size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => updateFilter('search', e.target.value)}
            placeholder="Search FAQs…"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text)', width: '100%', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={e => updateFilter('category', e.target.value)}
          style={{
            height: 34, padding: '0 10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 7,
            color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={e => updateFilter('sort', e.target.value)}
          style={{
            height: 34, padding: '0 10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)', borderRadius: 7,
            color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most Popular</option>
          <option value="views">Most Viewed</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none',
              fontSize: 12, color: 'var(--danger)', cursor: 'pointer', fontWeight: 500,
              padding: '4px 8px', borderRadius: 6,
            }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── FAQ grid ───────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <Loader size={22} style={{ color: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : faqs.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
          gap: 8,
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>No FAQs found</p>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            {hasFilters ? 'Try adjusting your filters' : 'Be the first to add one!'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} style={{ marginTop: 8, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 12,
        }}>
          {faqs.map(faq => (
            <FAQCard key={faq._id} faq={faq} isNew={newFaqIds.has(faq._id)} viewLang={lang} />
          ))}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────── */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {page > 1 && (
            <button
              onClick={() => updateFilter('page', String(page - 1))}
              className="btn-secondary btn-sm"
            >
              ← Previous
            </button>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-3)', padding: '0 8px' }}>
            Page {page} of {pagination.pages}
          </span>
          {page < pagination.pages && (
            <button
              onClick={() => updateFilter('page', String(page + 1))}
              className="btn-secondary btn-sm"
            >
              Next →
            </button>
          )}
        </div>
      )}

      {/* ── Create FAQ Modal ────────────────────────────────────── */}
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

function CreateFAQModal({ onClose, onCreated, categories }) {
  const [form, setForm]       = useState({ question: '', answer: '', category: '', tags: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tagList = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await fetch(`${API}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fade-in 0.15s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'slide-up 0.2s ease-out',
        }}
      >
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Add New FAQ
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, background: 'var(--surface-2)',
              border: 'none', borderRadius: 7, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-2)',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.15)',
              color: 'var(--danger)', fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {[
            { field: 'question', label: 'Question', type: 'text', placeholder: 'What would you like to ask?', required: true },
          ].map(({ field, label, type, placeholder, required }) => (
            <div key={field}>
              <label className="label">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                className="input"
                placeholder={placeholder}
                required={required}
                style={{ width: '100%' }}
              />
            </div>
          ))}

          <div>
            <label className="label">Answer</label>
            <textarea
              value={form.answer}
              onChange={e => setForm({ ...form, answer: e.target.value })}
              className="textarea"
              rows={4}
              placeholder="Provide a detailed answer…"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="input"
              required
              style={{ width: '100%' }}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => setForm({ ...form, tags: e.target.value })}
              className="input"
              placeholder="python, api, tutorial"
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, height: 38 }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, height: 38, justifyContent: 'center', gap: 8 }}
            >
              {loading && <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
              Submit FAQ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}