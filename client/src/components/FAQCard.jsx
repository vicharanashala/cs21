import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUp, Eye, MessageCircle, Globe, Sparkles, MoreVertical,
  Edit2, Trash2, Share2, X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

// Lightweight JWT payload decode — no external dep needed
function decodeTokenPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return JSON.parse(atob(padded))
  } catch { return null }
}

const FLAGS = { en:'🇬🇧',hi:'🇮🇳',es:'🇪🇸',fr:'🇫🇷',ar:'🇸🇦',zh:'🇨🇳',de:'🇩🇪',pt:'🇧🇷' }

const CATEGORY_COLORS = {
  General:       { color: '#8B6DFF', bg: 'rgba(139,109,255,0.1)' },
  Billing:       { color: '#F5A623', bg: 'rgba(245,166,35,0.1)'  },
  Technical:     { color: '#3CB4F5', bg: 'rgba(60,180,245,0.1)'  },
  Account:       { color: '#30C59A', bg: 'rgba(48,197,154,0.1)'  },
  Security:      { color: '#FF6B6B', bg: 'rgba(255,107,107,0.1)' },
  'Getting Started': { color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
}

function getCategoryStyle(cat) {
  return CATEGORY_COLORS[cat] || { color: 'var(--text-3)', bg: 'var(--s2)' }
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n || 0)
}

export default function FAQCard({ faq, isNew = false, viewLang = 'en', index = 0, onEdit, onDelete }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { addToast } = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef(null)
  const catStyle  = getCategoryStyle(faq.category)
  const topBorder = isNew
    ? '2px solid #8B6DFF'
    : faq.isAI
    ? '2px solid #A78BFA'
    : `1px solid var(--border)`

  // Token-based fallback so the menu renders immediately for logged-in users
  // even before AuthContext finishes fetching /api/auth/me
  const hasToken = !!localStorage.getItem('token')
  const ownerId  = faq.user
    ? (typeof faq.user === 'object' ? faq.user._id : faq.user)
    : null
  let isOwner = false
  if (user) {
    isOwner = user.role === 'admin' || String(user._id) === String(ownerId)
  } else if (hasToken && ownerId) {
    const decoded = decodeTokenPayload(localStorage.getItem('token'))
    if (decoded) {
      isOwner = decoded.role === 'admin' || String(decoded.id || decoded.sub) === String(ownerId)
    }
  }
  const canModify = !authLoading && isOwner

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const close = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const handleDelete = async () => {
    if (!confirm(`Delete FAQ "${faq.question.slice(0, 40)}…"?`)) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/faqs/${faq._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        addToast('FAQ deleted', 'success', 3000)
        onDelete?.(faq._id)
      } else {
        addToast('Delete failed', 'error', 3000)
      }
    } catch {
      addToast('Delete failed', 'error', 3000)
    } finally {
      setDeleting(false)
      setMenuOpen(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: topBorder,
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--shadow-xs)',
          transition: 'all 0.18s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'visible',
          height: '100%',
          opacity: deleting ? 0.5 : 1,
          pointerEvents: deleting ? 'none' : 'auto',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow   = 'var(--shadow-md)'
          e.currentTarget.style.borderColor = 'var(--border-hover)'
          e.currentTarget.style.transform   = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow   = 'var(--shadow-xs)'
          e.currentTarget.style.borderColor = isNew ? '#8B6DFF' : faq.isAI ? '#A78BFA' : 'var(--border)'
          e.currentTarget.style.transform   = 'translateY(0)'
        }}
      >
        {/* ── Top accent strip ─────────────────────── */}
        {(faq.isAI || isNew) && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: isNew
              ? 'linear-gradient(90deg, #8B6DFF, #A78BFA)'
              : 'linear-gradient(90deg, #A78BFA, #7C5CFC)',
            borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
          }} />
        )}

        {/* ── Three-dot menu ───────────────────────── */}
        {canModify && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute', top: 10, right: 10,
              zIndex: 20,
            }}
          >
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o) }}
              style={{
                width: 26, height: 26,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: menuOpen ? 'var(--s2)' : 'transparent',
                border: 'none', borderRadius: 7,
                cursor: 'pointer', color: 'var(--text-3)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--s2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' } }}
              aria-label="FAQ options"
            >
              <MoreVertical size={14} />
            </button>

            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 'var(--r-md)',
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden',
                  minWidth: 150,
                  zIndex: 100,
                }}
                onClick={e => e.stopPropagation()}
              >
                {[
                  {
                    Icon: Edit2, label: 'Edit FAQ', danger: false,
                    action: () => { setMenuOpen(false); onEdit?.(faq) },
                  },
                  {
                    Icon: Trash2, label: 'Delete FAQ', danger: true,
                    action: handleDelete,
                  },
                ].map(({ Icon, label, danger, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px',
                      background: 'transparent',
                      border: 'none',
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'inherit',
                      color: danger ? 'var(--danger)' : 'var(--text)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = danger ? 'var(--danger-dim)' : 'var(--s2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ── Header ──────────────────────────────── */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, paddingRight: canModify ? 28 : 0 }}>
            <Link
              to={`/faqs/${faq._id}?from=${encodeURIComponent(location.pathname)}`}
              state={{ prevSearch: window.location.search }}
              style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text)',
                textDecoration: 'none', letterSpacing: '-0.01em',
                lineHeight: 1.45, flex: 1,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                transition: 'color 0.15s',
              }}
              onClick={e => e.stopPropagation()}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
            >
              {faq.question}
            </Link>

            {/* Badges — stacked top-right */}
            <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
              {faq.isAI && !isNew && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 700, background: 'var(--ai-dim)', color: 'var(--ai)',
                  padding: '2px 6px', borderRadius: 20,
                }}>
                  <Sparkles size={9} /> AI
                </span>
              )}
              {isNew && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 700,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  padding: '2px 6px', borderRadius: 20,
                  border: '1px solid rgba(139,109,255,0.25)',
                }}>
                  ✨ New
                </span>
              )}
              {viewLang !== 'en' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 10, fontWeight: 600,
                  background: 'var(--s2)', color: 'var(--text-3)',
                  padding: '2px 6px', borderRadius: 20,
                }}>
                  <Globe size={9} />
                  {FLAGS[viewLang] || viewLang.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Category pill */}
          <div style={{ marginBottom: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600,
              background: catStyle.bg, color: catStyle.color,
              padding: '2px 8px', borderRadius: 20,
              border: `1px solid ${catStyle.color}22`,
            }}>
              {faq.category}
            </span>
          </div>
        </div>

        {/* ── Answer preview ───────────────────────── */}
        <p style={{
          fontSize: 12.5, color: 'var(--text-2)',
          lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          margin: '0 16px 12px',
        }}>
          {faq.answer}
        </p>

        {/* ── Footer ───────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: '1px solid var(--border)',
          background: 'var(--s1)',
          gap: 8,
        }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            {faq.tags?.slice(0, 3).map(tag => (
              <span
                key={tag}
                style={{
                  fontSize: 10, color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                  padding: '2px 6px', borderRadius: 4, fontWeight: 500,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {[
              { Icon: ArrowUp,       value: formatCount(faq.votes)        },
              { Icon: Eye,           value: formatCount(faq.views)         },
              { Icon: MessageCircle, value: formatCount(faq.comments?.length) },
            ].map(({ Icon, value }) => (
              <div key={Icon.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Icon size={10} style={{ color: 'var(--text-3)' }} />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}