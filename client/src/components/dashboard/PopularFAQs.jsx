import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, BookOpen } from 'lucide-react'
import { EmptyState } from '../ui/GlassCard'

const API = '/api'
const token = () => localStorage.getItem('token')

export function PopularFAQs({ initialData = null, refreshKey = 0 }) {
  const [faqs, setFaqs]     = useState(initialData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) { setLoading(false); return }
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFaqs(d.popularFAQs))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false))
  }, [initialData, refreshKey])

  if (loading) return <Skeleton />

  if (!faqs?.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState icon={BookOpen} title="No popular FAQs yet" compact />
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {faqs.map((faq, i) => (
        <motion.div
          key={faq._id}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.2) }}
        >
          <Link
            to={`/faqs/${faq._id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 8px', borderRadius: 8,
              transition: 'background 0.12s',
              textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Rank */}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: i < 3 ? '#4F46E5' : 'var(--text-3)',
              width: 14, flexShrink: 0, textAlign: 'center',
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text)',
                lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {faq.question}
              </p>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{faq.category}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>·</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{faq.views} views</span>
              </div>
            </div>
            <TrendingUp size={10} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px' }}>
          <div style={{ width: 14, height: 12, borderRadius: 3, background: 'var(--surface-2)' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 11, width: `${70 + Math.random() * 30}%`, background: 'var(--surface-2)', borderRadius: 4 }} />
            <div style={{ height: 9, width: '40%', background: 'var(--surface-2)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}