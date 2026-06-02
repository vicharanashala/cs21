import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Avatar } from '../ui/GlassCard'
import { Trophy } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const medals = ['#FBBF24', '#ADAFBE', '#CD7F32'] // gold, silver, bronze

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

  if (error) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 8,
    }}>
      <p style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</p>
      <button
        onClick={load}
        style={{
          fontSize: 11, color: 'var(--accent)', background: 'none',
          border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
        }}
      >
        Retry
      </button>
    </div>
  )

  if (!leaders.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>No contributors yet</p>
    </div>
  )

  return (
    <div style={{
      flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      gap: 2, padding: '6px 0 10px',
    }}>
      {leaders.map((entry, i) => (
        <motion.div
          key={entry._id}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 16px', borderRadius: 10,
            transition: 'background 0.15s',
            cursor: 'default',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Rank */}
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: i < 3 ? `${medals[i]}20` : 'var(--surface-2)',
            border: i < 3 ? `1px solid ${medals[i]}40` : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {i < 3 ? (
              <Trophy size={11} style={{ color: medals[i] }} />
            ) : (
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)' }}>
                {i + 1}
              </span>
            )}
          </div>

          <Avatar name={entry.user?.name} size="md" />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}>
              {entry.user?.name?.split(' ')[0] || 'Anonymous'}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>
              {entry.faqCount || 0} FAQs · {entry.totalVotes || 0} votes
            </p>
          </div>

          {/* Score */}
          <div style={{
            padding: '2px 9px', borderRadius: 20,
            background: i < 3 ? `${medals[i]}18` : 'var(--surface-2)',
            border: `1px solid ${i < 3 ? medals[i] + '30' : 'var(--border)'}`,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 800,
              color: i < 3 ? medals[i] : 'var(--text-2)',
              letterSpacing: '-0.02em',
            }}>
              {(entry.totalVotes || 0) + (entry.faqCount || 0) * 10}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
      gap: 4, padding: '6px 0 10px',
    }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 16px',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'var(--surface-2)',
            animation: 'shimmer 1.8s infinite',
            backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
            backgroundSize: '200% 100%',
          }} />
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--surface-2)',
            animation: 'shimmer 1.8s infinite',
            backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
            backgroundSize: '200% 100%',
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              height: 10, width: '65%', borderRadius: 4,
              background: 'var(--surface-2)',
              animation: 'shimmer 1.8s infinite',
              backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
              backgroundSize: '200% 100%',
            }} />
            <div style={{
              height: 8, width: '40%', borderRadius: 4,
              background: 'var(--surface-2)',
              animation: 'shimmer 1.8s infinite',
              backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
              backgroundSize: '200% 100%',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}