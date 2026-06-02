import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, Plus } from 'lucide-react'
import { useState } from 'react'

function Avatar({ name, size = 28 }) {
  const colors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div
      className="avatar avatar-sm"
      style={{ width: size, height: size, background: c, fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── Page titles for the header ──────────────────────────────────────
const PAGE_META = {
  '/dashboard':     { title: 'Dashboard',     subtitle: 'Overview' },
  '/faqs':          { title: 'FAQ Browser',    subtitle: null       },
  '/chat':          { title: 'AI Chatbot',     subtitle: null       },
  '/notifications': { title: 'Notifications',  subtitle: null       },
  '/profile':       { title: 'Profile',        subtitle: null       },
  '/admin':         { title: 'Admin Panel',    subtitle: 'Management' },
}

export default function Topbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchVal, setSearchVal] = useState('')

  const pathKey = Object.keys(PAGE_META).find(k => location.pathname.startsWith(k)) || ''
  const meta = PAGE_META[pathKey] || { title: 'Crowd', subtitle: null }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/faqs?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        height: 56,
        display: 'flex', alignItems: 'center',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px',
          gap: 16,
        }}
      >
        {/* Left: greeting or page title */}
        <div style={{ minWidth: 0 }}>
          {location.pathname === '/dashboard' ? (
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {greeting()}, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                Here's what's happening today
              </p>
            </div>
          ) : (
            <div>
              <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {meta.title}
              </h1>
              {meta.subtitle && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                  {meta.subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Center: quick search */}
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0 12px',
            height: 34,
            width: 240,
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Search size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search FAQs…"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontSize: 13, color: 'var(--text)', width: '100%',
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              fontSize: 9, fontWeight: 600,
              background: 'var(--border)',
              color: 'var(--text-3)',
              padding: '2px 5px', borderRadius: 4,
              flexShrink: 0,
            }}
          >
            ⏎
          </kbd>
        </form>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Quick-add button */}
          <button
            onClick={() => navigate('/chat')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 7,
              padding: '0 12px', height: 32,
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(79,70,229,0.25)',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            <Plus size={13} />
            Ask AI
          </button>

          {/* User avatar */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              borderRadius: '50%',
              animation: 'pulse-ring 2s infinite',
            }}
          >
            <Avatar name={user?.name} size={30} />
          </button>
        </div>
      </div>
    </header>
  )
}