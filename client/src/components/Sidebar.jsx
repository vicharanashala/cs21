import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard, MessageSquare, BookOpen, User, Shield,
  LogOut, Sun, Moon, X, Menu, Bell, Sparkles, Github
} from 'lucide-react'
import { GITHUB_PROFILE_URL } from '../config/github'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '📊' },
  { to: '/faqs', label: 'FAQ Browser', icon: BookOpen, emoji: '📚' },
  { to: '/chat', label: 'AI Chatbot', icon: MessageSquare, emoji: '🤖' },
  { to: '/notifications', label: 'Notifications', icon: Bell, emoji: '🔔' },
  { to: '/profile', label: 'Profile', icon: User, emoji: '👤' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const NavItem = ({ to, label, icon: Icon, emoji }) => {
    const cls = ({ isActive }) =>
      `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/30'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
      }`
    return (
      <NavLink to={to} className={cls} onClick={() => setMobileOpen(false)}>
        <span className="text-base">{emoji}</span>
        <span>{label}</span>
      </NavLink>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 fixed h-full z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <span className="text-base font-bold text-gray-900 dark:text-white">Crowd</span>
            <p className="text-xs text-gray-400">AI FAQ Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon, emoji }) => (
            <NavItem key={to} to={to} label={label} icon={icon} emoji={emoji} />
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              <span className="text-base">🛡️</span>
              <span>Admin Panel</span>
              {user?.role === 'admin' && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-bold">!</span>
              )}
            </NavLink>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 w-full transition-all"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <Github size={12} />
            <span>@{import.meta.env.VITE_GITHUB_USERNAME || 'Nancypaul08'}</span>
          </a>
          <div className="px-3 py-2 text-xs text-gray-400 space-y-0.5">
            <p className="font-medium text-gray-600 dark:text-gray-300">{user?.name}</p>
            <p>{user?.email}</p>
            <p className="capitalize">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                user?.role === 'admin' ? 'bg-violet-500' : 'bg-emerald-500'
              }`} />
              {user?.role}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 backdrop-blur-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 transform transition-transform duration-250 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-base font-bold text-gray-900 dark:text-white">Crowd</span>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon, emoji }) => (
            <NavItem key={to} to={to} label={label} icon={icon} emoji={emoji} />
          ))}
          {user?.role === 'admin' && <NavItem to="/admin" label="Admin Panel" icon={Shield} emoji="🛡️" />}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 px-3 py-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
    </>
  )
}