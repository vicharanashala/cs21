import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, Badge, ConfidenceBar, EmptyState } from '../ui/GlassCard'
import { Sparkles, Check, Edit3, X, Loader } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

// Mock AI suggestions (in production these come from the AI pipeline)
const mockSuggestions = [
  { id: '1', question: 'How do I implement JWT refresh tokens in React?', category: 'Programming', confidence: 92, answer: 'To implement JWT refresh tokens in React: 1) Store access token in memory (not localStorage for security) 2) Store refresh token in httpOnly cookie 3) Add an Axios interceptor to catch 401 errors 4) On 401, call /refresh endpoint 5) If refresh succeeds, retry original request with new access token. Consider: sliding session expiration, token rotation, and blacklisting on logout.' },
  { id: '2', question: 'What is the best database for a startup in 2026?', category: 'Cloud/DevOps', confidence: 76, answer: 'For a startup in 2026: Postgres is the safest bet — reliable, scalable, and works for most use cases. For rapid prototyping with real-time needs, consider Supabase (Postgres + built-in auth/realtime). For document-heavy apps, MongoDB Atlas. For global read scaling, PlanetScale or Neon (serverless Postgres). Avoid over-engineering early — Postgres handles 1M+ DAU comfortably.' },
  { id: '3', question: 'How to reduce Next.js bundle size?', category: 'Programming', confidence: 88, answer: 'To reduce Next.js bundle size: 1) Use next/dynamic for lazy loading 2) Analyze with @next/bundle-analyzer 3) Replace heavy libraries (moment.js → date-fns, lodash → es-toolkit) 4) Enable SWC minification 5) Use `next/image` for automatic optimization 6) Enable `transpilePackages` only for needed deps 7) Consider route-based code splitting — Next.js does this automatically but monitor for regressions.' },
  { id: '4', question: 'How do microservices communicate securely?', category: 'Cloud/DevOps', confidence: 84, answer: 'Secure microservice communication: 1) Use mTLS (mutual TLS) for service-to-service auth 2) Implement service mesh (Istio/Linkerd) for automatic cert management 3) Use JWT/OAuth2 for API-level auth 4) Rotate credentials automatically 5) Rate limit each service 6) Log all inter-service calls for audit trail 7) Use a service mesh for east-west traffic policy enforcement.' },
]

export function AISuggestedAnswers() {
  const [suggestions, setSuggestions] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    // Simulate loading from API
    setTimeout(() => {
      setSuggestions(mockSuggestions)
      setLoading(false)
    }, 1200)
  }, [])

  const handleApprove = async (item) => {
    setActionLoading(item.id)
    await new Promise(r => setTimeout(r, 800))
    // In production: POST to /faqs to create the FAQ
    setSuggestions(prev => prev.filter(s => s.id !== item.id))
    setActionLoading(null)
  }

  const handleEdit = (item) => {
    setExpandedId(expandedId === item.id ? null : item.id)
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-violet-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Suggested Answers</h2>
        </div>
        <Badge variant="purple">🤖 Auto-gen</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState icon={Sparkles} title="All caught up!" description="No pending AI suggestions. Check back soon." />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {suggestions.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{item.question}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{item.category}</Badge>
                        <span className="text-xs text-gray-400">Confidence:</span>
                      </div>
                      <div className="mt-1.5">
                        <ConfidenceBar confidence={item.confidence} />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Draft Answer</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleApprove(item)}
                    disabled={actionLoading === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading === item.id ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Edit3 size={12} /> {expandedId === item.id ? 'Hide' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setSuggestions(prev => prev.filter(s => s.id !== item.id))}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </GlassCard>
  )
}