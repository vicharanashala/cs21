import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EmptyState } from '../ui/GlassCard'
import { CheckCircle } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function RecentlySolved({ initialData = null, refreshKey = 0 }) {
  const [faqs, setFaqs]     = useState(initialData)
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (initialData) { setLoading(false); return }
    fetch(`${API}/analytics/dashboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setFaqs(d.solvedFAQs))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialData, refreshKey])

  if (loading) return <SolvedSkeleton />

  if (!faqs?.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <EmptyState icon={CheckCircle} title="No solved FAQs" description="FAQs with 5+ votes appear here." compact />
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {faqs.map((faq, i) => (
        <motion.div
          key={faq._id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.2) }}
        >
          <Link
            to={`/faqs/${faq._id}`}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 9,
              padding: '7px 8px', borderRadius: 8,
              transition: 'background 0.12s', textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <CheckCircle size={13} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {faq.question}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  background: '#ECFDF5', color: '#059669',
                  padding: '1px 6px', borderRadius: 4,
                }}>
                  ✓ Solved
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  background: 'var(--surface-2)', color: 'var(--text-2)',
                  padding: '1px 6px', borderRadius: 4,
                }}>
                  {faq.category}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{faq.votes}↑</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

function SolvedSkeleton() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 8px' }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'var(--surface-2)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 11, width: '80%', background: 'var(--surface-2)', borderRadius: 4 }} />
            <div style={{ height: 9, width: '35%', background: 'var(--surface-2)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}