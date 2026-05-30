import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth }  from '../context/AuthContext'
import { useRefresh } from '../context/RefreshContext'
import { RecentFAQs }     from '../components/dashboard/RecentFAQs'
import { PopularFAQs }    from '../components/dashboard/PopularFAQs'
import { RecentlySolved } from '../components/dashboard/RecentlySolved'
import { RisingTopics }   from '../components/dashboard/RisingTopics'
import { LiveActivityFeed } from '../components/dashboard/LiveActivityFeed'
import { TopContributors }  from '../components/dashboard/Leaderboard'
import { AISuggestedAnswers } from '../components/dashboard/AISuggestedAnswers'
import { SearchFailures }  from '../components/dashboard/SearchFailures'
import { AIUsageAnalytics } from '../components/dashboard/AIUsageAnalytics'
import {
  Sparkles, RefreshCw, TrendingUp, Inbox,
  Zap, Users, Activity, ChevronRight,
} from 'lucide-react'

const API   = '/api'
const ACCENT = '#7C3AED'
const getToken = () => localStorage.getItem('token')

// ── Stat pill ─────────────────────────────────────────────────
function StatPill({ label, value, icon: Icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '7px 14px',
    }}>
      {Icon && <Icon size={13} style={{ color: 'var(--accent)' }} />}
      <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.04em' }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}

// ── Card shell ─────────────────────────────────────────────────
function Card({ children, style = {}, className = '' }) {
  return (
    <div
      className={`card ${className}`}
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style }}
    >
      {children}
    </div>
  )
}

function CardHeader({ icon: Icon, iconColor, title, badge, action }) {
  return (
    <div className="card-header" style={{ flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {Icon && <Icon size={13} style={{ color: iconColor || 'var(--text-3)' }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {title}
        </span>
        {badge > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: 'var(--accent-dim)', color: 'var(--accent)',
            padding: '1px 7px', borderRadius: 20, lineHeight: '18px',
          }}>
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

// ── FAQ tab switcher ───────────────────────────────────────────
const FAQ_TABS = [
  { key: 'recent',  label: 'Recent'  },
  { key: 'popular', label: 'Popular' },
  { key: 'solved',  label: 'Solved'  },
]

// ── Main ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { refreshKey, triggerRefresh } = useRefresh()
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [faqTab, setFaqTab]   = useState('recent')
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${API}/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
        const d = await res.json()
        if (!cancelled) setStats(d)
      } catch { /* keep stale */ }
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [refreshKey])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const dayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const badgeStyle = (active) => ({
    padding: '3px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
    transition: 'all 0.12s',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-3)',
    boxShadow: active ? `0 2px 8px ${ACCENT}40` : 'none',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      style={{ padding: '24px 28px', maxWidth: 1360, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >

      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.035em', lineHeight: 1.15 }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>{dayStr}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!loading && stats && (
            <>
              <StatPill label="FAQs"  value={stats.totalFAQs}  icon={Inbox}    />
              <StatPill label="Chats" value={stats.totalChats} icon={Zap}      />
              <StatPill label="Users" value={stats.totalUsers} icon={Users}    />
            </>
          )}
          <button
            onClick={triggerRefresh}
            disabled={loading}
            title="Refresh"
            style={{
              width: 34, height: 34,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: loading ? 'var(--text-3)' : 'var(--text-2)',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <RefreshCw size={13}
              style={loading ? { animation: 'spin 0.8s linear infinite' } : {}}
            />
          </button>
          <Link to="/chat" className="btn btn-primary" style={{ textDecoration: 'none', height: 34, padding: '0 16px', fontSize: 13 }}>
            <Sparkles size={12} /> Ask AI
          </Link>
        </div>
      </div>

      {/* ══ ROW 1 — Recent FAQs + Trending ════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'stretch' }}>

        {/* LEFT: Recent FAQs */}
        <Card>
          <CardHeader
            icon={Inbox}
            iconColor="var(--text-3)"
            title="Recent FAQs"
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
                  {FAQ_TABS.map(t => (
                    <button key={t.key} onClick={() => setFaqTab(t.key)} style={badgeStyle(faqTab === t.key)}>
                      {t.label}
                    </button>
                  ))}
                </div>
                <Link to="/faqs" style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none',
                }}>
                  Browse all <ChevronRight size={11} />
                </Link>
              </div>
            }
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 320 }}>
            <div style={{ padding: '6px 0 10px' }}>
              {faqTab === 'recent'  && <RecentFAQs />}
              {faqTab === 'popular' && <PopularFAQs />}
              {faqTab === 'solved'  && <RecentlySolved />}
            </div>
          </div>
        </Card>

        {/* RIGHT: Trending Topics */}
        <Card>
          <CardHeader
            icon={TrendingUp}
            iconColor="var(--info)"
            title="Trending"
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 320 }}>
            <div style={{ padding: '6px 0 10px' }}>
              <RisingTopics />
            </div>
          </div>
        </Card>
      </div>

      {/* ══ ROW 2 — Analytics (centerpiece) ═══════════════════════ */}
      <Card>
        <CardHeader
          icon={Zap}
          iconColor="var(--warning)"
          title="Analytics"
          action={
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>Last 14 days</span>
          }
        />
        <div style={{ padding: '14px 20px 18px', minHeight: 260 }}>
          <AIUsageAnalytics refreshKey={refreshKey} />
        </div>
      </Card>

      {/* ══ ROW 3 — Activity + Top Contributors ═══════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <Card>
          <CardHeader
            icon={Activity}
            iconColor="var(--success)"
            title="Community Activity"
            action={
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                background: 'var(--success-dim)', color: 'var(--success)',
                padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--success)', display: 'inline-block',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                LIVE
              </span>
            }
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 240 }}>
            <div style={{ padding: '6px 0 10px' }}>
              <LiveActivityFeed refreshKey={refreshKey} />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={Users}
            iconColor="var(--accent)"
            title="Top Contributors"
            action={
              <Link to="/admin" style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                View all →
              </Link>
            }
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 240 }}>
            <div style={{ padding: '6px 0 10px' }}>
              <TopContributors refreshKey={refreshKey} />
            </div>
          </div>
        </Card>
      </div>

      {/* ══ ADMIN ROW — AI Suggestions + Unanswered ═══════════════ */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <CardHeader
              icon={Sparkles}
              iconColor="#A855F7"
              title="AI Suggestions"
              badge={stats?.pendingCount || 0}
              action={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>Drafts from search misses</span>}
            />
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 180 }}>
              <div style={{ padding: '6px 0 10px' }}>
                <AISuggestedAnswers refreshKey={refreshKey} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              icon={Inbox}
              iconColor="var(--warning)"
              title="Unanswered Questions"
              badge={stats?.unansweredCount || 0}
              action={
                <Link to="/chat" style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                  Create FAQ →
                </Link>
              }
            />
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, maxHeight: 180 }}>
              <div style={{ padding: '6px 0 10px' }}>
                <SearchFailures isAdmin refreshKey={refreshKey} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ══ FOOTER NAV ════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 24, paddingTop: 4, paddingBottom: 8,
      }}>
        {[
          { to: '/faqs',    label: 'Browse FAQs'  },
          { to: '/chat',    label: 'AI Chatbot'    },
          { to: '/profile', label: 'Profile'       },
          ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
              textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            {label}
          </Link>
        ))}
      </div>
    </motion.div>
  )
}