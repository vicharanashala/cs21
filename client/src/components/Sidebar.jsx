import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, MessageSquare, BookOpen, User,
  LogOut, Sun, Moon, X, Menu, Bell, Shield, Github,
} from 'lucide-react'
import { GITHUB_PROFILE_URL } from '../config/github'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/faqs',         label: 'FAQ Browser',  Icon: BookOpen        },
  { to: '/chat',         label: 'AI Chatbot',   Icon: MessageSquare   },
  { to: '/notifications',label: 'Notifications',Icon: Bell            },
  { to: '/profile',      label: 'Profile',      Icon: User            },
]

const SIDEBAR_W = 260
const OVERLAY_Z = 45
const SIDEBAR_Z = 46

function Avatar({ name, size = 28 }) {
  const colors = ['#4F46E5','#7C3AED','#059669','#D97706','#DC2626','#0891B2']
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

function NavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                width: 3, height: 16, borderRadius: '0 3px 3px 0',
                background: 'var(--accent)',
              }}
            />
          )}
          <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo + close */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px 14px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* Geometric logo mark */}
        <div style={{ width: 28, height: 28, flexShrink: 0 }}>
          <svg viewBox="0 0 28 28" fill="none">
            <rect x="4" y="4" width="14" height="14" rx="3" fill="#7C5CFC" />
            <rect x="10" y="10" width="14" height="14" rx="3" fill="#7C5CFC" opacity="0.35" />
          </svg>
        </div>
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: 'var(--text)', letterSpacing: '-0.03em',
        }}>
          Crowd
        </span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', width: 28, height: 28,
            background: 'var(--surface-2)', border: 'none',
            borderRadius: 7, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1, padding: '10px 10px',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 1,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
          padding: '4px 7px 8px',
        }}>
          Menu
        </p>
        {NAV.map(({ to, label, Icon }) => (
          <NavItem
            key={to} to={to} label={label} Icon={Icon}
            onClick={onClose}
          />
        ))}

        {user?.role === 'admin' && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <p style={{
              fontSize: 10, fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              padding: '4px 7px 8px',
            }}>
              Admin
            </p>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 16, borderRadius: '0 3px 3px 0',
                      background: '#7C3AED',
                    }} />
                  )}
                  <Shield size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  <span>Admin Panel</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 9, fontWeight: 800,
                    background: '#7C3AED22', color: '#7C3AED',
                    padding: '1px 6px', borderRadius: 4, letterSpacing: 0,
                  }}>
                    !
                  </span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '12px 12px 16px',
        flexShrink: 0,
      }}>
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 8px', borderRadius: 10,
          background: 'var(--surface-2)', marginBottom: 10,
        }}>
          <Avatar name={user?.name} size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.name}
            </p>
            <p style={{
              fontSize: 10, color: 'var(--text-3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </p>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: user?.role === 'admin' ? '#7C3AED22' : '#10B98122',
            color: user?.role === 'admin' ? '#7C3AED' : '#10B981',
            padding: '2px 6px', borderRadius: 4,
            textTransform: 'capitalize', flexShrink: 0,
          }}>
            {user?.role}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={toggle}
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'flex-start', gap: 7, fontSize: 12 }}
          >
            {dark ? <Sun size={14} /> : <Moon size={14} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="btn-ghost"
            style={{
              flex: 1, justifyContent: 'flex-start', gap: 7, fontSize: 12,
              color: 'var(--danger)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 10, color: 'var(--text-3)',
            padding: '8px 2px 0',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <Github size={11} />
          <span>@{import.meta.env.VITE_GITHUB_USERNAME || 'Nancypaul08'}</span>
        </a>
      </div>
    </div>
  )
}

// ── Hamburger toggle button ─────────────────────────────────────────────
function HamburgerBtn({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      style={{
        position: 'fixed', top: 14, left: 14, zIndex: SIDEBAR_Z + 1,
        width: 38, height: 38,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-2)',
        boxShadow: 'var(--shadow-md)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
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
    </motion.button>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const sidebarRef = useRef(null)
  const location = useLocation()
  const isFaqBrowser = location.pathname === '/faqs'

  // Listen for programmatic open (from PageHeader button in FAQBrowser)
  useEffect(() => {
    const openSidebar = () => setOpen(true)
    window.addEventListener('open-sidebar', openSidebar)
    return () => window.removeEventListener('open-sidebar', openSidebar)
  }, [])

  // Close on route change
  useEffect(() => {
    setOpen(false)
  }, [])

  // Close when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        // Also check hamburger button
        const hamburger = document.getElementById('sidebar-hamburger')
        if (hamburger && hamburger.contains(e.target)) return
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    // Close on Escape
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <>
      {/* Hamburger — hidden on FAQ Browser page (PageHeader has its own) */}
      {!isFaqBrowser && (
        <motion.button
          id="sidebar-hamburger"
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: SIDEBAR_Z + 1,
            width: 38, height: 38,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-2)',
            boxShadow: 'var(--shadow-md)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu size={17} />
        </motion.button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: OVERLAY_Z,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(3px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: -SIDEBAR_W, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -SIDEBAR_W, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0,
              width: SIDEBAR_W,
              background: 'var(--surface)',
              borderRight: '1px solid var(--border)',
              zIndex: SIDEBAR_Z,
              boxShadow: 'var(--shadow-xl)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <SidebarContent onClose={() => setOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}