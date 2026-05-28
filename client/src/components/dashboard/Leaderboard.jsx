import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, Avatar, Badge } from '../ui/GlassCard'
import { Trophy, Star, ArrowUp, Award, Zap } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const mockLeaderboard = [
  { rank: 1, user: { name: 'Alex Rivera', avatar: '' }, xp: 3420, faqsCreated: 28, upvotesReceived: 412, acceptedSolutions: 14 },
  { rank: 2, user: { name: 'Alice Chen', avatar: '' }, xp: 2180, faqsCreated: 19, upvotesReceived: 287, acceptedSolutions: 9 },
  { rank: 3, user: { name: 'Bob Kumar', avatar: '' }, xp: 1850, faqsCreated: 15, upvotesReceived: 221, acceptedSolutions: 7 },
  { rank: 4, user: { name: 'Carol Singh', avatar: '' }, xp: 1620, faqsCreated: 12, upvotesReceived: 198, acceptedSolutions: 5 },
  { rank: 5, user: { name: 'David Park', avatar: '' }, xp: 1340, faqsCreated: 9, upvotesReceived: 143, acceptedSolutions: 3 },
]

const medalColors = ['text-amber-400', 'text-gray-300', 'text-amber-600']

export function TopContributors() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/leaderboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setLeaders(d.leaderboard || mockLeaderboard))
      .catch(() => setLeaders(mockLeaderboard))
      .finally(() => setLoading(false))
  }, [])

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Contributors</h2>
        </div>
        <Badge variant="warning">🏆 Leaderboard</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-1.5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" /><div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" /></div>
          </div>
        ))}</div>
      ) : (
        <div className="space-y-1">
          {leaders.slice(0, 5).map((entry, i) => {
            const isTop3 = entry.rank <= 3
            return (
              <motion.div
                key={entry.user._id || entry.rank}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${isTop3 ? 'bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
              >
                <div className={`w-7 text-center font-bold text-sm ${isTop3 ? medalColors[i] : 'text-gray-400'}`}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                </div>
                <Avatar name={entry.user?.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.user?.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5"><Star size={10} />{entry.faqsCreated} FAQs</span>
                    <span className="flex items-center gap-0.5"><ArrowUp size={10} />{entry.upvotesReceived} votes</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-sm font-bold text-brand-600 dark:text-brand-400">
                    <Zap size={12} />{entry.xp?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">XP</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}