import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EmptyState } from '../ui/GlassCard'
import { Plus, Clock, Loader, ArrowUpRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const API = '/api'
const token = () => localStorage.getItem('token')

export function SearchFailures({ isAdmin = false, refreshKey = 0 }) {
  const [failures, setFailures] = useState([])
  const [loading, setLoading]   = useState(true)
  const [converting, setConverting] = useState(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    if (!isAdmin) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/analytics/search-failures`, {
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      setFailures(data.failures || [])
    } catch {
      setFailures([])
    } finally {
      setLoading(false)
    }
  }, [isAdmin])

  useEffect(() => { load() }, [load, refreshKey])

  const handleConvert = async (item) => {
    if (converting) return
    setConverting(item._id)
    try {
      await fetch(`${API}/analytics/search-failures/${item._id}/convert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      })
      setFailures(prev => prev.filter(f => f._id !== item._id))
      navigate('/chat', { state: { question: item.query } })
    } catch { /* ignore */ }
    finally { setConverting(null) }
  }

  if (!isAdmin) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Admin only</p>
      </div>
    )
  }

  if (loading) return <FailuresSkeleton />

  if (failures.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <EmptyState
          icon={ArrowUpRight}
          title="All clear"
          description="No failed searches left to address."
          compact
        />
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 3,
      padding: '4px 4px 8px',
    }}>
      {failures.map((item, i) => (
        <motion.div
          key={item._id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 24 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            transition: 'all 0.15s ease',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--border-hover)'
            e.currentTarget.style.background = 'var(--surface-2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'var(--surface)'
          }}
        >
          {/* Failure count badge */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '4px 8px', borderRadius: 8,
            background: 'var(--danger-dim)', flexShrink: 0,
            minWidth: 40,
          }}>
            <span style={{
              fontSize: 14, fontWeight: 800,
              color: 'var(--danger)', letterSpacing: '-0.04em', lineHeight: 1,
            }}>
              {item.count}
            </span>
            <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--danger)', opacity: 0.7 }}>
              FAILED
            </span>
          </div>

          {/* Query text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}>
              "{item.query}"
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
            }}>
              <Clock size={9} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                {formatDistanceToNow(new Date(item.lastSearched), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Convert button */}
          <button
            onClick={() => handleConvert(item)}
            disabled={converting === item._id}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              background: 'var(--accent)', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: '#fff',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px var(--accent-dim)',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)'
              e.currentTarget.style.boxShadow = '0 4px 14px var(--accent-glow)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 2px 8px var(--accent-dim)'
            }}
            onClickStopPropagation
          >
            {converting === item._id ? (
              <><Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> Converting…</>
            ) : (
              <><Plus size={10} /> Create FAQ</>
            )}
          </button>
        </motion.div>
      ))}
    </div>
  )
}

function FailuresSkeleton() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 4px 8px' }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px', borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: 'var(--surface-2)',
            animation: 'shimmer 1.8s infinite',
            backgroundImage: 'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
            backgroundSize: '200% 100%',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              height: 10, borderRadius: 4,
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