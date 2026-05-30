import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, MessageSquare, BookOpen, User,
  LogOut, Sun, Moon, X, Menu, Bell, Shield, Github,
} from 'lucide-react'
import { GITHUB_PROFILE_URL } from '../config/github'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/faqs',         label: 'FAQ Browser',  Icon: BookOpen        },
  { to: '/chat',         label: 'AI Chatbot',   Icon: MessageSquare   },
  { to: '/notifications',label: 'Notifications',Icon: Bell            },
  { to: '/profile',      label: 'Profile',      Icon: User            },
]

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
          {/* Active indicator bar */}
          {isActive && (
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
              style={{ background: 'var(--accent)' }}
            />
          )}
          <Icon size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* Geometric icon: two rounded rects forming a "C" mark */}
        <div style={{ width: 28, height: 28, flexShrink: 0 }}>
          <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="14" height="14" rx="3" fill="#4F46E5" />
            <rect x="10" y="10" width="14" height="14" rx="3" fill="#4F46E5" opacity="0.4" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em' }}>
          Crowd
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 7px 6px' }}>Menu</p>
        {NAV.map(({ to, label, Icon }) => (
          <NavItem key={to} to={to} label={label} Icon={Icon} onClick={() => setOpen(false)} />
        ))}

        {user?.role === 'admin' && (
          <>
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '4px 7px 6px' }}>Admin</p>
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full" style={{ background: '#7C3AED' }} />
                  )}
                  <Shield size={15} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                  <span>Admin Panel</span>
                  <span
                    className="ml-auto"
                    style={{
                      fontSize: 9, fontWeight: 700,
                      background: '#7C3AED', color: '#fff',
                      padding: '1px 5px', borderRadius: 4,
                      letterSpacing: 0,
                    }}
                  >
                    !
                  </span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom section */}
      <div
        className="shrink-0"
        style={{ borderTop: '1px solid var(--border)', padding: '12px 12px 16px' }}
      >
        {/* User info */}
        <div
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-2"
          style={{ background: 'var(--surface-2)' }}
        >
          <Avatar name={user?.name} size={28} />
          <div className="min-w-0 flex-1">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
          <span
            style={{
              fontSize: 9, fontWeight: 600,
              background: user?.role === 'admin' ? '#7C3AED22' : '#10B98122',
              color: user?.role === 'admin' ? '#7C3AED' : '#10B981',
              padding: '2px 6px', borderRadius: 4,
              textTransform: 'capitalize',
              flexShrink: 0,
            }}
          >
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
            style={{ flex: 1, justifyContent: 'flex-start', gap: 7, fontSize: 12, color: 'var(--danger)' }}
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
          className="flex items-center gap-1.5"
          style={{
            fontSize: 10, color: 'var(--text-3)',
            padding: '6px 2px 0',
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

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col"
        style={{
          width: 220,
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 40,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden"
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', top: 12, left: 12, zIndex: 50,
          width: 36, height: 36,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          color: 'var(--text-2)',
        }}
      >
        <Menu size={16} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 45,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          width: 260,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          zIndex: 46,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.2s ease',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Close button */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 28, height: 28,
              background: 'var(--surface-2)',
              border: 'none', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-2)',
            }}
          >
            <X size={13} />
          </button>
        </div>
        <SidebarContent />
      </aside>
    </>
  )
}