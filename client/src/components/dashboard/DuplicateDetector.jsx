import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, Badge, ProgressBar } from '../ui/GlassCard'
import { Search, GitMerge, AlertTriangle, Check, X } from 'lucide-react'

// Simulated semantic similarity checking
const mockSimilar = [
  { question: 'How do I train a CNN model?', similarity: 89, category: 'AI/ML' },
  { question: 'Best CNN training practices?', similarity: 76, category: 'AI/ML' },
  { question: 'CNN vs RNN: which to use?', similarity: 45, category: 'AI/ML' },
]

export function DuplicateDetector({ onClose }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const handleCheck = async () => {
    if (!question.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setResults(mockSimilar)
    setLoading(false)
  }

  const mergeThreshold = 85

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitMerge size={18} className="text-amber-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Duplicate Question Detector</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Enter a question to check for duplicates
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={question}
                onChange={e => { setQuestion(e.target.value); setResults(null) }}
                placeholder="How do I train a CNN model from scratch?"
                className="input-field pl-9 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
              />
            </div>
            <button
              onClick={handleCheck}
              disabled={!question.trim() || loading}
              className="btn-primary text-sm px-4 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </div>

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Similar Questions Found</h3>
              <Badge variant={results[0]?.similarity >= mergeThreshold ? 'danger' : 'warning'}>
                {results[0]?.similarity >= mergeThreshold ? '⚠️ Possible Duplicate' : 'Similar Found'}
              </Badge>
            </div>

            {results.map((item, i) => {
              const isDuplicate = item.similarity >= mergeThreshold
              const barColor = item.similarity >= 80
                ? 'bg-red-400'
                : item.similarity >= 60
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'

              return (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${isDuplicate ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-800'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isDuplicate ? (
                        <AlertTriangle size={14} className="text-red-500" />
                      ) : (
                        <Check size={14} className="text-emerald-500" />
                      )}
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.question}</p>
                    </div>
                    <Badge variant={isDuplicate ? 'danger' : 'success'}>{item.similarity}% match</Badge>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700`}
                      style={{ width: `${item.similarity}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge variant="default">{item.category}</Badge>
                    {isDuplicate && (
                      <button className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                        <GitMerge size={10} /> Merge Entry
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {results[0]?.similarity >= mergeThreshold && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2"
              >
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This question is <strong>{results[0].similarity}% similar</strong> to an existing FAQ. Consider merging or linking to avoid duplicate entries.
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </GlassCard>
  )
}