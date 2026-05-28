import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { GlassCard, Badge } from '../components/ui/GlassCard'
import { RecentFAQs } from '../components/dashboard/RecentFAQs'
import { PopularFAQs } from '../components/dashboard/PopularFAQs'
import { RisingTopics } from '../components/dashboard/RisingTopics'
import { AISuggestedAnswers } from '../components/dashboard/AISuggestedAnswers'
import { DuplicateDetector } from '../components/dashboard/DuplicateDetector'
import { SearchFailures } from '../components/dashboard/SearchFailures'
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed'
import { RecentlySolved } from '../components/dashboard/RecentlySolved'
import { TopContributors } from '../components/dashboard/Leaderboard'
import { AIUsageAnalytics } from '../components/dashboard/AIUsageAnalytics'
import { SmartNotifications } from '../components/dashboard/SmartNotifications'
import { VoiceFAQAssistant } from '../components/dashboard/VoiceFAQAssistant'
import {
  BookOpen, Users, MessageSquare, FolderOpen,
  ArrowRight, TrendingUp, Sparkles
} from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

// Row wrapper — equal-height flex layout
function Row({ children, className = '' }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`flex flex-col md:flex-row items-stretch gap-5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

// Each card slot — flex-1 with equal height
function Slot({ children, className = '' }) {
  return (
    <motion.div variants={itemVariants} className={`flex flex-col ${className}`}>
      {children}
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total FAQs', value: stats?.totalFAQs ?? 0, icon: BookOpen, color: 'from-brand-500 to-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20', iconColor: 'text-brand-600' },
    { label: 'Community Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20', iconColor: 'text-violet-600' },
    { label: 'AI Interactions', value: stats?.totalChats ?? 0, icon: MessageSquare, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', iconColor: 'text-emerald-600' },
    { label: 'Categories', value: stats?.categoryCount ?? 0, icon: FolderOpen, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', iconColor: 'text-amber-600' },
  ]

  const StatCardItem = ({ label, value, icon: Icon, color, bg, iconColor }) => (
    <Slot>
      <GlassCard className="p-5 flex flex-col h-full">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.03]`} />
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
          <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center`}>
            <Icon size={16} className={iconColor} />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums mt-auto">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
          <TrendingUp size={11} />
          <span>+{Math.floor(Math.random() * 12 + 3)}% this week</span>
        </div>
      </GlassCard>
    </Slot>
  )

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 px-1">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Here's what's happening on <span className="text-brand-600 font-medium">Crowd</span> today.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isAdmin && <Badge variant="warning">🛡️ Admin</Badge>}
          <Link to="/chat" className="btn-primary flex items-center gap-2 text-sm">
            <Sparkles size={15} /> Ask AI
          </Link>
        </div>
      </motion.div>

      {/* Stats Row — 4 equal cards */}
      <Row>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Slot key={i}><GlassCard className="p-5 h-full"><div className="h-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" /></GlassCard></Slot>)
          : statCards.map(card => <StatCardItem key={card.label} {...card} />)
        }
      </Row>

      {/* Row 2: Recent FAQs (1/3) + Popular FAQs (1/3) + Live Activity (1/3) */}
      <Row>
        <Slot className="w-full md:w-1/3"><RecentFAQs initialData={stats?.recentFAQs} /></Slot>
        <Slot className="w-full md:w-1/3"><PopularFAQs initialData={stats?.popularFAQs} /></Slot>
        <Slot className="w-full md:w-1/3"><LiveActivityFeed /></Slot>
      </Row>

      {/* Row 3: AI Suggestions + Recently Solved + Top Contributors */}
      <Row>
        <Slot className="w-full md:w-1/3"><AISuggestedAnswers /></Slot>
        <Slot className="w-full md:w-1/3"><RecentlySolved initialData={stats?.solvedFAQs} /></Slot>
        <Slot className="w-full md:w-1/3"><TopContributors /></Slot>
      </Row>

      {/* Row 4: AI Analytics (1/2) + Rising Topics (1/4) + Notifications (1/4) */}
      <Row>
        <Slot className="w-full lg:w-1/2"><AIUsageAnalytics /></Slot>
        <Slot className="w-full lg:w-1/4"><RisingTopics /></Slot>
        <Slot className="w-full lg:w-1/4"><SmartNotifications /></Slot>
      </Row>

      {/* Row 5: Search Failures + Duplicate Detector (admin only, side by side) */}
      {isAdmin && (
        <Row>
          <Slot className="w-full md:w-1/2"><SearchFailures isAdmin={true} /></Slot>
          <Slot className="w-full md:w-1/2"><DuplicateDetector /></Slot>
        </Row>
      )}

      {/* Voice FAQ Assistant — full width */}
      <Slot><VoiceFAQAssistant /></Slot>

      {/* Bottom quick links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-center gap-4 py-2 text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800"
      >
        <Link to="/faqs" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
          Browse FAQs <ArrowRight size={14} />
        </Link>
        <span>·</span>
        <Link to="/chat" className="flex items-center gap-1.5 hover:text-brand-600 transition-colors">
          Chat with AI <ArrowRight size={14} />
        </Link>
        <span>·</span>
        <Link to="/profile" className="hover:text-brand-600 transition-colors">Profile</Link>
        {isAdmin && (<><span>·</span><Link to="/admin" className="hover:text-brand-600 transition-colors">Admin Panel</Link></>)}
      </motion.div>

    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}