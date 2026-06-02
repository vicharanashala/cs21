import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowUp, Eye, MessageCircle, Calendar,
  Tag, Folder, Share2, Copy, Check, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'

const LANG_FLAGS = { en:'🇬🇧',hi:'🇮🇳',es:'🇪🇸',fr:'🇫🇷',ar:'🇸🇦',zh:'🇨🇳',de:'🇩🇪',pt:'🇧🇷' }
const getToken = () => localStorage.getItem('token')

export default function FAQDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [faq, setFaq]               = useState(null)
  const [related, setRelated]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [copied, setCopied]         = useState(false)
  const [lang, setLang]             = useState(() => localStorage.getItem('faq_lang') || 'en')
  const [voted, setVoted]           = useState(false)

  useEffect(() => {
    if (!id) { navigate('/faqs'); return }
    setLoading(true)
    fetch(`/api/faqs/${id}?lang=${lang}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setFaq(d.faq); return d.faq })
      .then(faq => {
        if (faq?._id) {
          return fetch(`/api/faqs?category=${encodeURIComponent(faq.category)}&limit=4`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }).then(r => r.json()).then(d => {
            setRelated((d.faqs || []).filter(f => f._id !== id).slice(0, 3))
          })
        }
      })
      .catch(() => navigate('/faqs'))
      .finally(() => setLoading(false))
  }, [id, lang])

  // Vote
  const handleVote = async () => {
    if (voted) return
    try {
      const r = await fetch(`/api/faqs/${id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (r.ok) {
        setFaq(prev => ({ ...prev, votes: (prev.votes || 0) + 1 }))
        setVoted(true)
        addToast('Vote recorded!', 'success', 3000)
      }
    } catch {}
  }

  // Copy answer
  const handleCopy = () => {
    navigator.clipboard.writeText(faq.answer).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return <DetailSkeleton />
  if (!faq) return null

  const backLabel = new URLSearchParams(window.location.search).get('from') === 'browser'
    ? 'Back to browser'
    : 'Back to FAQs'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 36px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52 }}>
          <Link
            to="/faqs"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 500, color: 'var(--text-2)',
              textDecoration: 'none', padding: '4px 8px', borderRadius: 7,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--s1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}
          >
            <ArrowLeft size={14} /> {backLabel}
          </Link>
          <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3)', flex: 1, minWidth: 0 }} className="truncate">
            {faq.category}
          </span>
          {faq.isAI && (
            <span className="badge badge-ai">🤖 AI-generated</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '36px 36px' }}>

        {/* Category + language badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          <span className="badge badge-default">{faq.category}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-3)', background: 'var(--s2)', padding: '2px 8px', borderRadius: 20 }}>
            <Globe size={10} /> {LANG_FLAGS[lang] || lang}
          </span>
          {faq.tags?.map(tag => (
            <span key={tag} style={{ fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Question */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.035em', lineHeight: 1.2,
            marginBottom: 20,
          }}
        >
          {faq.question}
        </motion.h1>

        {/* Author + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-dim)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {faq.author?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {faq.author?.name || 'Community'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently added'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Eye size={12} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{faq.views || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={12} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{faq.comments?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Answer card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: '24px 28px',
            boxShadow: 'var(--shadow-md)', marginBottom: 20,
          }}
        >
          <p style={{
            fontSize: 15, color: 'var(--text)', lineHeight: 1.75,
          }}>
            {faq.answer}
          </p>
        </motion.div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          <button
            onClick={handleVote}
            disabled={voted}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 36, borderRadius: 9,
              border: `1px solid ${voted ? 'var(--accent)' : 'var(--border)'}`,
              background: voted ? 'var(--accent-dim)' : 'var(--s1)',
              color: voted ? 'var(--accent)' : 'var(--text-2)',
              fontSize: 13, fontWeight: 600, cursor: voted ? 'default' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <ArrowUp size={14} /> {faq.votes || 0} {voted ? 'Voted' : 'Vote'}
          </button>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 36, borderRadius: 9,
              border: '1px solid var(--border)', background: 'var(--s1)',
              color: 'var(--text-2)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {copied ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Related FAQs */}
        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Related FAQs
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {related.map(r => (
                <Link
                  key={r._id}
                  to={`/faqs/${r._id}?from=browser`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: 'var(--s1)', border: '1px solid var(--border)',
                    borderRadius: 11, textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--s2)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--s1)' }}
                >
                  <ChevronRight size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}
                    className="line-clamp-1"
                  >
                    {r.question}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>{r.category}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '52px 36px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton" style={{ height: 16, width: 120, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 12, width: 100, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 36, width: '70%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 16, width: 140, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16, marginTop: 8 }} />
      </div>
    </div>
  )
}