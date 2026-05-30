import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Avatar, EmptyState } from '../ui/GlassCard'
import { useRefresh } from '../../context/RefreshContext'
import { Trophy, RefreshCw } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function TopContributors({ refreshKey = 0 }) {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/leaderboard`, { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLeaders(data.leaderboard?.slice(0, 5) || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  if (loading) return <Skeleton />
  if (error)   return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
      <p style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</p>
      <button onClick={load} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  )
  if (!leaders.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState icon={Trophy} title="No leaders yet" compact />
    </div>
  )

  const medals = ['#F59E0B', '#9CA3AF', '#CD7F32']

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {leaders.map((entry, i) => (
        <motion.div
          key={entry._id}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 4px', borderRadius: 7,
          }}
        >
          {/* Rank */}
          <div style={{
            width: 18, height: 18,
            borderRadius: 4,
            background: i < 3 ? `${medals[i]}22` : 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {i < 3 ? (
              <Trophy size={10} style={{ color: medals[i] }} />
            ) : (
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)' }}>{i + 1}</span>
            )}
          </div>

          <Avatar name={entry.user?.name} size="sm" />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {entry.user?.name?.split(' ')[0] || 'Anonymous'}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {entry.faqCount || 0} FAQs · {entry.totalVotes || 0} votes
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px' }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--surface-2)' }} />
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 10, width: '70%', background: 'var(--surface-2)', borderRadius: 3 }} />
            <div style={{ height: 9, width: '45%', background: 'var(--surface-2)', borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  )
}