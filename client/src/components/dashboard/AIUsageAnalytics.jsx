import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../ui/GlassCard'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

const COLORS = ['#2D6FE8', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 12,
  color: '#374151',
}

export function AIUsageAnalytics({ refreshKey = 0 }) {
  const [chatByDay, setChatByDay]         = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [userByDay, setUserByDay]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('activity')

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const d = await res.json()

      const fourteenDays  = buildLast14Days()
      const chatMap = Object.fromEntries(Object.entries(d.chatByDay || {}).slice(-14))
      const userMap = Object.fromEntries(Object.entries(d.userByDay || {}).slice(-14))
      fourteenDays.forEach(day => {
        day.chats = chatMap[day.date] || 0
        day.faqs  = userMap[day.date] || 0
      })
      setChatByDay(fourteenDays)
      setUserByDay(fourteenDays)
      setCategoryBreakdown((d.categoryBreakdown || []).map(c => ({
        name:  c._id || 'Unknown',
        value: c.count,
        views: c.totalViews,
        votes: c.totalVotes,
      })))
    } catch { /* leave empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData, refreshKey])

  const dayOfWeekData = chatByDay.length > 0
    ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => ({
        hour:  day,
        count: chatByDay.filter(d => new Date(d.date).getDay() === i).reduce((s, d) => s + d.chats, 0),
      }))
    : []

  const tabs = [
    { key: 'activity',   label: 'Activity'   },
    { key: 'categories', label: 'Categories' },
    { key: 'dow',        label: 'By Day'     },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex gap-1 mb-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 shrink-0">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          {activeTab === 'activity' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              <p className="text-[10px] text-gray-400 mb-1">Chats & FAQs — last 14 days</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={chatByDay} margin={{ top: 2, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="chats" name="AI Chats" fill="#2D6FE8" radius={[3,3,0,0]} />
                  <Bar dataKey="faqs"  name="New FAQs" fill="#10B981" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              <p className="text-[10px] text-gray-400 mb-1">FAQ distribution by category</p>
              {categoryBreakdown.length === 0 ? (
                <div className="flex items-center justify-center h-36 text-[12px] text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown} cx="50%" cy="50%"
                      innerRadius={36} outerRadius={60}
                      dataKey="value" paddingAngle={3}
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} />
                    <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          )}

          {activeTab === 'dow' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
              <p className="text-[10px] text-gray-400 mb-1">Chats by day of week</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={dayOfWeekData} margin={{ top: 2, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour"  tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" name="Chats"
                    stroke="#8B5CF6" strokeWidth={2.5}
                    dot={{ r: 3, fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function buildLast14Days() {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d    = new Date(); d.setDate(d.getDate() - i)
    const name = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const comma = name.indexOf(',')
    days.push({ date: d.toISOString().split('T')[0], name: comma !== -1 ? name.slice(0, comma) : name, chats: 0, faqs: 0 })
  }
  return days
}