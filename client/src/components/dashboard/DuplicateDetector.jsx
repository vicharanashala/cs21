import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/GlassCard'
import { GitMerge, AlertTriangle, Check, Loader } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')
const MERGE_THRESHOLD = 80

export function DuplicateDetector() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading]   = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState('')

  const handleCheck = useCallback(async () => {
    if (!question.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/faqs/check-duplicate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body:    JSON.stringify({ question: question.trim() }),
      })
      if (!res.ok) throw new Error('Check failed')
      setResults(await res.json())
    } catch {
      setError('Could not check duplicates. Is the server running?')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [question, loading])

  const barColor = (s) => s >= 80 ? 'bg-red-400' : s >= 60 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Input row */}
      <div className="flex gap-1.5 mb-2 shrink-0">
        <input
          value={question}
          onChange={e => { setQuestion(e.target.value); setResults(null) }}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
          placeholder="Check for duplicates…"
          className="input-field text-[12px] py-2"
        />
        <button
          onClick={handleCheck}
          disabled={!question.trim() || loading}
          className="btn-primary text-[11px] px-3 py-2 shrink-0 disabled:opacity-50"
        >
          {loading ? <Loader size={11} className="animate-spin" /> : 'Check'}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500 mb-1.5">{error}</p>}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              {results.duplicates.length > 0 ? `${results.duplicates.length} similar found` : 'No duplicates'}
            </p>
            {results.duplicates[0] && (
              <Badge variant={results.hasHighMatch ? 'danger' : 'warning'}>
                {results.duplicates[0].similarity}% top match
              </Badge>
            )}
          </div>

          {results.duplicates.map(item => {
            const isDup = item.similarity >= MERGE_THRESHOLD
            return (
              <div
                key={item._id}
                className={`p-2 rounded-xl border ${
                  isDup ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10'
                        : 'border-gray-100 dark:border-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isDup
                      ? <AlertTriangle size={11} className="text-red-500 shrink-0" />
                      : <Check size={11} className="text-emerald-500 shrink-0" />}
                    <Link
                      to={`/faqs/${item._id}`}
                      className="text-[12px] font-medium text-gray-700 dark:text-gray-200 hover:text-brand-500 transition-colors line-clamp-2 leading-snug"
                    >
                      {item.question}
                    </Link>
                  </div>
                  <Badge variant={isDup ? 'danger' : 'success'} className="text-[10px] shrink-0 ml-1">
                    {item.similarity}%
                  </Badge>
                </div>

                {/* Similarity bar */}
                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor(item.similarity)} rounded-full`}
                    style={{ width: `${item.similarity}%` }}
                  />
                </div>
              </div>
            )
          })}

          {results.hasHighMatch && (
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle size={11} className="shrink-0" />
                Similar FAQ found — consider linking instead of duplicating.
              </p>
              <Link
                to={`/faqs/${results.duplicates[0]._id}`}
                className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 inline-block hover:underline"
              >
                View existing →&nbsp;
              </Link>
            </div>
          )}

          {results.duplicates.length === 0 && (
            <div className="flex flex-col items-center justify-center h-20 gap-1">
              <Check size={22} className="text-emerald-400" />
              <p className="text-[11px] text-gray-400">No similar FAQ found — looks unique!</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}