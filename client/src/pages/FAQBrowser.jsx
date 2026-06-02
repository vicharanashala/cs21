import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import FAQCard from '../components/FAQCard'
import {
  Search, Plus, X, Sparkles, Globe, Menu,
  LayoutGrid, List, ChevronDown, Loader,
  BookOpen, Clock, TrendingUp, Award, Zap,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'

const API = '/api'
const NEW_FAQ_HIGHLIGHT_MS = 30_000

const LANGUAGES = [
  { code:'en',name:'English',   native:'English',   flag:'🇬🇧', dir:'ltr' },
  { code:'hi',name:'Hindi',     native:'हिन्दी',     flag:'🇮🇳', dir:'ltr' },
  { code:'es',name:'Spanish',   native:'Español',   flag:'🇪🇸', dir:'ltr' },
  { code:'fr',name:'French',    native:'Français',  flag:'🇫🇷', dir:'ltr' },
  { code:'ar',name:'Arabic',    native:'العربية',    flag:'🇸🇦', dir:'rtl' },
  { code:'zh',name:'Chinese',   native:'中文',       flag:'🇨🇳', dir:'ltr' },
  { code:'de',name:'German',    native:'Deutsch',   flag:'🇩🇪', dir:'ltr' },
  { code:'pt',name:'Portuguese',native:'Português', flag:'🇧🇷', dir:'ltr' },
]

// ── Category icons ───────────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Getting Started':   { icon: Zap,        color: '#30C59A' },
  'Account & Billing': { icon: Award,      color: '#F5A623' },
  'Technical Support': { icon: BookOpen,   color: '#3CB4F5' },
  'General':           { icon: Sparkles,   color: '#8B6DFF' },
  'Security':          { icon: Zap,        color: '#FF6B6B' },
  'API & Integration': { icon: TrendingUp, color: '#A78BFA' },
}

function getCat(name) {
  return CATEGORY_ICONS[name] || { icon: BookOpen, color: 'var(--text-3)' }
}

// ── Page header with aurora ───────────────────────────────────────────
function PageHeader({ total, newCount, onMenuClick }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 24, paddingBottom: 24, paddingRight: 24, marginBottom: 0 }}>
      {/* Aurora blobs */}
      <div style={{
        position:'absolute',top:-60,left:'5%',
        width:360,height:220,borderRadius:'50%',
        background:'radial-gradient(ellipse,#8B6DFF22 0%,transparent 70%)',
        filter:'blur(50px)',pointerEvents:'none',
        animation:'aurora-1 22s ease-in-out infinite',
      }} />
      <div style={{
        position:'absolute',top:-30,right:'10%',
        width:280,height:180,borderRadius:'50%',
        background:'radial-gradient(ellipse,#3CB4F51a 0%,transparent 70%)',
        filter:'blur(50px)',pointerEvents:'none',
        animation:'aurora-2 28s ease-in-out infinite',
      }} />

      {/* Flex row: hamburger + title block */}
      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.35 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          paddingLeft: 20,
          paddingRight: 12,
        }}
      >
        {/* Hamburger button */}
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          style={{
            width: 38, height: 38, flexShrink: 0,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
            boxShadow: 'var(--shadow-md)',
            transition: 'border-color 0.15s, color 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-hover)'
            e.currentTarget.style.color = 'var(--text)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
        >
          <Menu size={17} />
        </button>

        {/* Title + subtitle column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          paddingLeft: 20,  /* 20px gap between icon and title */
          minWidth: 0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 style={{
              fontSize:'clamp(18px,3vw,26px)',fontWeight:800,
              color:'var(--text)',letterSpacing:'-0.04em',margin:0,
              lineHeight: 1.2,
            }}>
              Knowledge Base
            </h1>
            {newCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  display:'inline-flex',alignItems:'center',
                  fontSize:11,fontWeight:700,
                  background:'var(--accent-dim)',color:'var(--accent)',
                  padding:'2px 8px',borderRadius:20,
                  border:'1px solid rgba(139,109,255,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                +{newCount} new
              </motion.span>
            )}
          </div>
          <p style={{ fontSize:13, color:'var(--text-3)', margin:0, lineHeight: 1 }}>
            {total > 0 ? `${total.toLocaleString()} articles` : 'Loading…'}
          </p>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,height:50,
        background:'linear-gradient(to bottom,transparent,var(--bg))',
        pointerEvents:'none',
      }} />
    </div>
  )
}

// ── Category pill nav ─────────────────────────────────────────────────
function CategoryNav({ categories, selected, onSelect }) {
  return (
    <div style={{
      display:'flex',gap:6,padding:'0 36px',
      marginBottom:16, overflowX:'auto',
    }}>
      <button
        onClick={() => onSelect('')}
        style={{
          display:'inline-flex',alignItems:'center',gap:5,
          padding:'5px 12px',borderRadius:20,border:'1px solid',
          borderColor: selected === '' ? 'var(--accent)' : 'var(--border)',
          background: selected === '' ? 'var(--accent-dim)' : 'transparent',
          color: selected === '' ? 'var(--accent)' : 'var(--text-2)',
          fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',
          fontFamily:'inherit',transition:'all 0.15s',
        }}
      >
        All
      </button>
      {categories.map(cat => {
        const { icon: Icon, color } = getCat(cat.name)
        const isActive = selected === cat.name
        return (
          <button
            key={cat._id}
            onClick={() => onSelect(isActive ? '' : cat.name)}
            style={{
              display:'inline-flex',alignItems:'center',gap:5,
              padding:'5px 12px',borderRadius:20,border:'1px solid',
              borderColor: isActive ? color : 'var(--border)',
              background: isActive ? `${color}18` : 'transparent',
              color: isActive ? color : 'var(--text-2)',
              fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',
              fontFamily:'inherit',transition:'all 0.15s',
            }}
          >
            <Icon size={11} /> {cat.name}
            {cat.count > 0 && (
              <span style={{ fontSize:10, opacity:0.7 }}>({cat.count})</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────
function FilterBar({ search, sort, onSearch, onSort, hasFilters, onClear }) {
  return (
    <div style={{
      display:'flex',gap:8,padding:'0 36px',
      marginBottom:20, flexWrap:'wrap',
    }}>
      {/* Search */}
      <div style={{
        display:'flex',alignItems:'center',gap:8,
        background:'var(--surface)',border:'1px solid var(--border)',
        borderRadius:'var(--r-sm)',padding:'0 12px',
        height:36,flex:1,minWidth:180,
        transition:'border-color 0.15s',
      }}>
        <Search size={13} style={{ color:'var(--text-3)',flexShrink:0 }} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search questions, topics…"
          style={{
            background:'transparent',border:'none',outline:'none',
            fontSize:13,color:'var(--text)',width:'100%',fontFamily:'inherit',
          }}
        />
        {search && (
          <button onClick={() => onSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',display:'flex',padding:0 }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={e => onSort(e.target.value)}
        style={{
          height:36,padding:'0 10px',
          background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:'var(--r-sm)',color:'var(--text)',fontSize:12,
          cursor:'pointer',fontFamily:'inherit',
          transition:'border-color 0.15s',
        }}
      >
        <option value="newest">🕑 Newest</option>
        <option value="oldest">🕐 Oldest</option>
        <option value="popular">🔥 Most Popular</option>
        <option value="views">👁 Most Viewed</option>
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          style={{
            display:'flex',alignItems:'center',gap:4,
            background:'var(--danger-dim)',border:'1px solid rgba(255,107,107,0.2)',
            color:'var(--danger)',borderRadius:'var(--r-sm)',
            padding:'0 11px',height:36,fontSize:12,fontWeight:600,
            cursor:'pointer',fontFamily:'inherit',
          }}
        >
          <X size={11} /> Clear
        </button>
      )}
    </div>
  )
}

// ── FAQ grid ──────────────────────────────────────────────────────────
function FAQGrid({ faqs, loading, newFaqIds, viewLang, hasFilters, onEdit, onDelete }) {
  if (loading) {
    return (
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14,padding:'0 36px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:16,display:'flex',flexDirection:'column',gap:10 }}>
            <div className="skeleton" style={{ height:14,width:'80%',borderRadius:4 }} />
            <div className="skeleton" style={{ height:12,width:'40%',borderRadius:4 }} />
            <div className="skeleton" style={{ height:48,borderRadius:6 }} />
            <div className="skeleton" style={{ height:24,borderRadius:4,marginTop:4 }} />
          </div>
        ))}
      </div>
    )
  }

  if (faqs.length === 0) {
    return (
      <div style={{ padding:'60px 36px',textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:12 }}>🔍</div>
        <p style={{ fontSize:16,fontWeight:700,color:'var(--text-2)',marginBottom:6 }}>No FAQs found</p>
        <p style={{ fontSize:13,color:'var(--text-3)' }}>
          {hasFilters ? 'Try different keywords or clear your filters' : 'No FAQs have been added yet'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:14,padding:'0 36px 40px' }}>
      {faqs.map((faq, i) => (
        <FAQCard
          key={faq._id}
          faq={faq}
          isNew={newFaqIds.has(faq._id)}
          viewLang={viewLang}
          index={i}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────
function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return (
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'center',gap:8,
      padding:'0 36px 40px',
    }}>
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="btn-secondary"
        style={{ height:34,padding:'0 14px',fontSize:12 }}
      >
        ← Previous
      </button>
      <span style={{ fontSize:12,color:'var(--text-3)',padding:'0 8px' }}>
        {page} / {pages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        className="btn-secondary"
        style={{ height:34,padding:'0 14px',fontSize:12 }}
      >
        Next →
      </button>
    </div>
  )
}

// ── Create FAQ modal ──────────────────────────────────────────────────
function CreateFAQModal({ onClose, onCreated, categories }) {
  const [form, setForm]       = useState({ question:'', answer:'', category:'', tags:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const tagList = form.tags.split(',').map(t=>t.trim()).filter(Boolean)
      const res = await fetch(`${API}/faqs`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ ...form, tags:tagList }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Failed to create FAQ')
      onCreated()
    } catch (err) { setError(err.message) }
    finally       { setLoading(false) }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed',inset:0,zIndex:50,
        background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)',
        display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        animation:'fade-in 0.15s ease-out',
      }}
    >
      <motion.div
        initial={{ opacity:0, scale:0.96, y:10 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96 }}
        transition={{ duration:0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%',maxWidth:520,
          background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:'var(--r-xl)',boxShadow:'var(--shadow-xl)',
          maxHeight:'90vh',overflowY:'auto',
        }}
      >
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'18px 22px 16px',borderBottom:'1px solid var(--border)',
        }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text)',letterSpacing:'-0.02em',margin:0 }}>
            Add New FAQ
          </h2>
          <button onClick={onClose} style={{
            width:28,height:28,background:'var(--s2)',border:'none',
            borderRadius:7,cursor:'pointer',display:'flex',
            alignItems:'center',justifyContent:'center',color:'var(--text-2)',
          }}>
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:20,display:'flex',flexDirection:'column',gap:14 }}>
          {error && (
            <div style={{
              padding:'10px 14px',borderRadius:8,
              background:'var(--danger-dim)',border:'1px solid rgba(255,107,107,0.2)',
              color:'var(--danger)',fontSize:13,
            }}>{error}</div>
          )}

          <div>
            <label className="label">Question *</label>
            <input className="input" value={form.question}
              onChange={e=>setForm({...form,question:e.target.value})}
              placeholder="What would you like to ask?" required />
          </div>

          <div>
            <label className="label">Answer *</label>
            <textarea className="textarea" rows={4} value={form.answer}
              onChange={e=>setForm({...form,answer:e.target.value})}
              placeholder="Provide a clear, detailed answer…"
              required style={{ width:'100%' }} />
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category}
              onChange={e=>setForm({...form,category:e.target.value})} required style={{ width:'100%' }}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags}
              onChange={e=>setForm({...form,tags:e.target.value})}
              placeholder="python, api, tutorial" style={{ width:'100%' }} />
          </div>

          <div style={{ display:'flex',gap:8,paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1,height:38 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ flex:1,height:38,justifyContent:'center',gap:8 }}>
              {loading && <Loader size={13} style={{ animation:'spin 0.8s linear infinite' }} />}
              Submit FAQ
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Edit FAQ modal ──────────────────────────────────────────────────────
function EditFAQModal({ faq, onClose, onSaved, categories }) {
  const [form, setForm]       = useState({ question: faq.question, answer: faq.answer, category: faq.category, tags: (faq.tags || []).join(', ') })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const tagList = form.tags.split(',').map(t=>t.trim()).filter(Boolean)
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/faqs/${faq._id}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, tags:tagList }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error||'Failed to update FAQ')
      onSaved()
    } catch (err) { setError(err.message) }
    finally       { setLoading(false) }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position:'fixed',inset:0,zIndex:50,
        background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)',
        display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        animation:'fade-in 0.15s ease-out',
      }}
    >
      <motion.div
        initial={{ opacity:0, scale:0.96, y:10 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96 }}
        transition={{ duration:0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%',maxWidth:520,
          background:'var(--surface)',border:'1px solid var(--border)',
          borderRadius:'var(--r-xl)',boxShadow:'var(--shadow-xl)',
          maxHeight:'90vh',overflowY:'auto',
        }}
      >
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'18px 22px 16px',borderBottom:'1px solid var(--border)',
        }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'var(--text)',letterSpacing:'-0.02em',margin:0 }}>
            Edit FAQ
          </h2>
          <button onClick={onClose} style={{
            width:28,height:28,background:'var(--s2)',border:'none',
            borderRadius:7,cursor:'pointer',display:'flex',
            alignItems:'center',justifyContent:'center',color:'var(--text-2)',
          }}>
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding:20,display:'flex',flexDirection:'column',gap:14 }}>
          {error && (
            <div style={{
              padding:'10px 14px',borderRadius:8,
              background:'var(--danger-dim)',border:'1px solid rgba(255,107,107,0.2)',
              color:'var(--danger)',fontSize:13,
            }}>{error}</div>
          )}

          <div>
            <label className="label">Question *</label>
            <input className="input" value={form.question}
              onChange={e=>setForm({...form,question:e.target.value})}
              placeholder="What would you like to ask?" required />
          </div>

          <div>
            <label className="label">Answer *</label>
            <textarea className="textarea" rows={4} value={form.answer}
              onChange={e=>setForm({...form,answer:e.target.value})}
              placeholder="Provide a clear, detailed answer…"
              required style={{ width:'100%' }} />
          </div>

          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category}
              onChange={e=>setForm({...form,category:e.target.value})} required style={{ width:'100%' }}>
              <option value="">Select category…</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags}
              onChange={e=>setForm({...form,tags:e.target.value})}
              placeholder="python, api, tutorial" style={{ width:'100%' }} />
          </div>

          <div style={{ display:'flex',gap:8,paddingTop:4 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1,height:38 }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary"
              style={{ flex:1,height:38,justifyContent:'center',gap:8 }}>
              {loading && <Loader size={13} style={{ animation:'spin 0.8s linear infinite' }} />}
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────
export default function FAQBrowser() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [faqs, setFaqs]               = useState([])
  const [categories, setCategories]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [pagination, setPagination]   = useState(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [editingFaq, setEditingFaq]   = useState(null)
  const [newFaqIds, setNewFaqIds]     = useState(new Set())
  const [lang, setLang]               = useState(() => localStorage.getItem('faq_lang') || 'en')
  const [langOpen, setLangOpen]       = useState(false)

  const { addToast } = useToast()

  const search   = searchParams.get('search')   || ''
  const category = searchParams.get('category') || ''
  const sort     = searchParams.get('sort')     || 'newest'
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
    const close = e => { if (!e.target.closest('.lang-selector')) setLangOpen(false) }
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
      const res  = await fetch(`${API}/faqs?${params}`)
      const data = await res.json()
      setFaqs(data.faqs || [])
      setPagination(data.pagination)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, page, lang])

  useEffect(() => { loadFAQs() }, [loadFAQs])

  useEffect(() => {
    fetch(`${API}/categories`).then(r=>r.json()).then(d => {
      const cats = d.categories || []
      setCategories(cats.map(c => ({ ...c, count: c.count || 0 })))
    }).catch(() => {})
  }, [])

  // Real-time new FAQ events
  useEffect(() => {
    const handler = ({ detail }) => {
      const { type, faq } = detail || {}
      if (type !== 'ai_faq_created' || !faq?._id) return
      setFaqs(prev => prev.some(f=>f._id===faq._id) ? prev : [{...faq, isNew:true}, ...prev])
      setPagination(prev => prev ? {...prev, total:prev.total+1} : prev)
      setNewFaqIds(prev => { const n=new Set(prev); n.add(faq._id); return n })
      setTimeout(() => setNewFaqIds(prev => { const n=new Set(prev); n.delete(faq._id); return n }), NEW_FAQ_HIGHLIGHT_MS)
      addToast(
        <span><Sparkles size={12} style={{ display:'inline',marginRight:5,color:'#8B6DFF' }} /><strong>New AI FAQ</strong> — {faq.category}</span>,
        'ai', 6000
      )
    }
    window.addEventListener('socket-activity', handler)
    return () => window.removeEventListener('socket-activity', handler)
  }, [addToast])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({ sort })
  const hasFilters   = search || category

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <PageHeader
        total={pagination?.total || 0}
        newCount={newFaqIds.size}
        onMenuClick={() => window.dispatchEvent(new Event('open-sidebar'))}
      />

      {/* Sticky controls */}
      <div style={{
        position:'sticky',top:0,zIndex:30,
        background:'rgba(10,11,15,0.9)',backdropFilter:'blur(16px)',
        borderBottom:'1px solid var(--border)',
        paddingTop:10,paddingBottom:12,
      }}>
        <CategoryNav categories={categories} selected={category} onSelect={v => updateFilter('category', v)} />
        <FilterBar
          search={search} sort={sort}
          onSearch={v => updateFilter('search', v)}
          onSort={v => updateFilter('sort', v)}
          hasFilters={hasFilters}
          onClear={clearFilters}
        />

        {/* Action row */}
        <div style={{ display:'flex',alignItems:'center',gap:8,padding:'0 36px' }}>
          {/* Language */}
          <div className="lang-selector" style={{ position:'relative' }}>
            <button
              onClick={() => setLangOpen(o=>!o)}
              style={{
                display:'flex',alignItems:'center',gap:6,
                background:'var(--surface)',border:'1px solid var(--border)',
                borderRadius:'var(--r-sm)',padding:'0 12px',height:32,
                fontSize:12,fontWeight:500,color:'var(--text)',
                cursor:'pointer',fontFamily:'inherit',
                transition:'border-color 0.15s',
              }}
            >
              <Globe size={12} style={{ color:'var(--accent)' }} />
              {currentLang.flag} {currentLang.native}
              <ChevronDown size={11} style={{ color:'var(--text-3)' }} />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
                  transition={{ duration:0.15 }}
                  style={{
                    position:'absolute',top:'calc(100% + 6px)',left:0,
                    background:'var(--surface)',border:'1px solid var(--border)',
                    borderRadius:'var(--r-lg)',boxShadow:'var(--shadow-lg)',
                    overflow:'hidden',zIndex:200,minWidth:170,
                  }}
                >
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code} onClick={() => selectLang(l.code)}
                      dir={l.dir}
                      style={{
                        display:'flex',alignItems:'center',gap:8,
                        width:'100%',padding:'8px 14px',
                        background: l.code===lang ? 'var(--accent-dim)' : 'transparent',
                        border:'none',borderBottom:'1px solid var(--border)',
                        fontSize:12, fontWeight: l.code===lang ? 600 : 400,
                        color: l.code===lang ? 'var(--accent)' : 'var(--text)',
                        cursor:'pointer',fontFamily:'inherit',textAlign:'left',
                      }}
                      onMouseEnter={e => { if(l.code!==lang) e.currentTarget.style.background='var(--s2)' }}
                      onMouseLeave={e => { if(l.code!==lang) e.currentTarget.style.background='transparent' }}
                    >
                      <span style={{ fontSize:14 }}>{l.flag}</span>
                      <span>{l.native}</span>
                      <span style={{ marginLeft:'auto',fontSize:10,color:'var(--text-3)' }}>{l.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
            style={{ height:32,fontSize:12,marginLeft:'auto' }}
          >
            <Plus size={13} /> Add FAQ
          </button>
        </div>
      </div>

      {/* FAQ grid */}
      <FAQGrid
        faqs={faqs} loading={loading}
        newFaqIds={newFaqIds} viewLang={lang}
        hasFilters={hasFilters}
        onEdit={setEditingFaq}
        onDelete={id => { setFaqs(prev => prev.filter(f => f._id !== id)); setPagination(prev => prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev) }}
      />

      {/* Pagination */}
      <Pagination page={page} pages={pagination?.pages || 1} onPage={p => updateFilter('page', String(p))} />

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateFAQModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadFAQs() }}
            categories={categories}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingFaq && (
          <EditFAQModal
            faq={editingFaq}
            onClose={() => setEditingFaq(null)}
            onSaved={() => { setEditingFaq(null); loadFAQs() }}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </div>
  )
}