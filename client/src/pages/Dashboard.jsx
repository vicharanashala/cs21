import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth }    from '../context/AuthContext'
import { useRefresh } from '../context/RefreshContext'
import { RecentFAQs }     from '../components/dashboard/RecentFAQs'
import { PopularFAQs }    from '../components/dashboard/PopularFAQs'
import { RecentlySolved } from '../components/dashboard/RecentlySolved'
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed'
import { TopContributors }  from '../components/dashboard/Leaderboard'
import { SearchFailures }  from '../components/dashboard/SearchFailures'
import { AIUsageAnalytics } from '../components/dashboard/AIUsageAnalytics'
import {
  TrendingUp, MessageSquare, Users, HelpCircle,
  Brain, Sparkles, AlertTriangle, Zap, ChevronRight,
  ArrowUpRight, Activity, Inbox, Clock,
} from 'lucide-react'

const getToken = () => localStorage.getItem('token')

// ── Bento card base ─────────────────────────────────────────────────
function Bento({ children, style, className, ...rest }) {
  return (
    <motion.div
      className="bento"
      style={{ padding: 0, display: 'flex', flexDirection: 'column', ...style }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

// ── Section header ──────────────────────────────────────────────────
function BentoHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px 12px',
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)',
          }}>
            <Icon size={14} />
          </div>
        )}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

// ── KPI metric card ─────────────────────────────────────────────────
function KPICard({ value, label, icon: Icon, accentColor = 'var(--accent)', trend, index = 0 }) {
  return (
    <motion.div
      className="bento"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2 }}
    >
      {/* Accent glow orb */}
      <div style={{
        position: 'absolute', top: -20, right: -10,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em',
            color: accentColor, lineHeight: 1.1,
          }}>{value}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, fontWeight: 500 }}>{label}</div>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor, flexShrink: 0,
        }}>
          <Icon size={16} />
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <ArrowUpRight size={12} style={{ color: trend >= 0 ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {Math.abs(trend)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>vs last week</span>
        </div>
      )}
    </motion.div>
  )
}

// ── AI Insight item ─────────────────────────────────────────────────
function InsightItem({ icon: Icon, color, title, desc, delay = 0 }) {
  return (
    <motion.div
      style={{
        display: 'flex', gap: 11, padding: '10px 12px', borderRadius: 10,
        background: 'var(--s1)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        transition: 'all 0.15s',
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay }}
      whileHover={{ background: 'var(--s2)', x: 2 }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        <Icon size={13} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </motion.div>
  )
}

// ── FAQ tab switcher ────────────────────────────────────────────────
function FAQTabs() {
  const [tab, setTab] = useState('recent')

  const tabs = [
    { key: 'recent', label: 'Recent' },
    { key: 'popular', label: 'Popular' },
    { key: 'solved', label: 'Solved' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 4, padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '4px 11px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: tab === t.key ? 'var(--accent)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--text-3)',
              transition: 'all 0.15s',
              boxShadow: tab === t.key ? '0 2px 8px var(--accent-glow)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/faqs" style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
          }}>
            View all <ChevronRight size={11} />
          </Link>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ height: '100%' }}
          >
            {tab === 'recent' && <RecentFAQs refreshKey="recent" />}
            {tab === 'popular' && <PopularFAQs refreshKey="popular" />}
            {tab === 'solved' && <RecentlySolved refreshKey="solved" />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Greeting ────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Main ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { refreshKey } = useRefresh()
  const [stats, setStats] = useState({ totalFAQs: 0, totalChats: 0, totalUsers: 0, unansweredCount: 0 })

  useEffect(() => {
    fetch('/api/analytics/dashboard', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setStats({
        totalFAQs:       d.totalFAQs       || 0,
        totalChats:      d.totalChats      || 0,
        totalUsers:      d.totalUsers      || 0,
        unansweredCount: d.unansweredCount || 0,
      }))
      .catch(() => {})
  }, [refreshKey])

  const firstName = user?.name?.split(' ')[0] || 'there'
  const first     = getGreeting()
  const dateStr   = formatDate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Aurora page header ──────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '48px 36px 28px' }}>
        {/* Aurora orbs */}
        <div style={{
          position: 'absolute', top: -80, left: '10%',
          width: 500, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(139,109,255,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'float-1 20s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: -40, right: '5%',
          width: 400, height: 250, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(60,180,245,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'float-2 26s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '40%',
          width: 350, height: 200, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(167,139,250,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
          animation: 'float-3 18s ease-in-out infinite',
        }} />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <h1 style={{
            fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800,
            color: 'var(--text)', letterSpacing: '-0.04em', margin: '0 0 4px',
          }}>
            {first}, {firstName}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: 0 }}>{dateStr}</p>
        </motion.div>

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, transparent, var(--bg))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div style={{ padding: '0 36px 60px' }}>

        {/* KPI row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 14, marginBottom: 20,
        }}>
          <KPICard index={0} value={stats.totalFAQs.toLocaleString()} label="Total FAQs"
            icon={HelpCircle}    accentColor="var(--accent)"    trend={12} />
          <KPICard index={1} value={stats.totalChats.toLocaleString()} label="AI Chats"
            icon={MessageSquare} accentColor="var(--info)"      trend={8} />
          <KPICard index={2} value={stats.totalUsers.toLocaleString()} label="Community Members"
            icon={Users}         accentColor="var(--success)"   trend={24} />
          {user?.role === 'admin' && (
            <KPICard index={3} value={stats.unansweredCount} label="Unanswered"
              icon={Inbox}       accentColor="var(--warning)"   />
          )}
        </div>

        {/* Bento row 2: AI Insights + FAQ tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          gap: 14, marginBottom: 20,
          alignItems: 'stretch',
        }}>

          {/* AI Insights */}
          <Bento>
            <BentoHeader title="AI Insights" icon={Brain} />
            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InsightItem icon={Sparkles}   color="var(--success)" delay={0.05} title="Knowledge base growing"
                desc="23 new FAQs this week — 94% from resolved chats." />
              <InsightItem icon={AlertTriangle} color="var(--warning)" delay={0.12} title="Duplicate detected"
                desc="2 FAQs are >90% similar. Review for merge." />
              <InsightItem icon={TrendingUp} color="var(--accent)" delay={0.19} title="Trending: billing"
                desc="Usage and pricing questions up 3× this week." />
              <InsightItem icon={Zap} color="var(--info)" delay={0.26} title="Fast response time"
                desc="Avg. AI response: 1.4s — 99.2% resolution rate." />
            </div>
          </Bento>

          {/* FAQ tabs */}
          <Bento>
            <BentoHeader title="Community FAQs" icon={Activity} />
            <FAQTabs />
          </Bento>
        </div>

        {/* Analytics — full width */}
        <div style={{ marginBottom: 20 }}>
          <AIUsageAnalytics />
        </div>

        {/* Row 4: Activity + Leaderboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 14, marginBottom: 20,
        }}>
          <LiveActivityFeed refreshKey={refreshKey} />
          <TopContributors  refreshKey={refreshKey} />
        </div>

        {/* Search failures — admin only */}
        {user?.role === 'admin' && (
          <SearchFailures refreshKey={refreshKey} />
        )}
      </div>
    </div>
  )
}