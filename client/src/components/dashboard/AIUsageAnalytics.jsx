import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, Badge } from '../ui/GlassCard'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

const COLORS = ['#2D6FE8', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4']

// Generate last 14 days of mock data
const generateDailyData = () => {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).split(',')[0]
    days.push({
      name: label,
      chats: Math.floor(Math.random() * 40 + 10),
      faqs: Math.floor(Math.random() * 12 + 2),
      users: Math.floor(Math.random() * 5 + 1),
    })
  }
  return days
}

const categoryPieData = [
  { name: 'AI/ML', value: 35 },
  { name: 'Programming', value: 28 },
  { name: 'Cloud/DevOps', value: 15 },
  { name: 'Finance', value: 10 },
  { name: 'Education', value: 7 },
  { name: 'Others', value: 5 },
]

const peakHourData = [
  { hour: '2am', count: 3 }, { hour: '4am', count: 2 }, { hour: '6am', count: 5 },
  { hour: '8am', count: 18 }, { hour: '10am', count: 32 }, { hour: '12pm', count: 28 },
  { hour: '2pm', count: 35 }, { hour: '4pm', count: 41 }, { hour: '6pm', count: 38 },
  { hour: '8pm', count: 29 }, { hour: '10pm', count: 15 }, { hour: '12am', count: 6 },
]

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.95)',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  fontSize: 12,
  color: '#374151',
}

export function AIUsageAnalytics() {
  const [dailyData, setDailyData] = useState(generateDailyData())
  const [activeTab, setActiveTab] = useState('activity')

  const tabs = [
    { key: 'activity', label: 'Activity' },
    { key: 'categories', label: 'Categories' },
    { key: 'peak', label: 'Peak Hours' },
  ]

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">AI Usage Analytics</h2>
        </div>
        <Badge variant="default">📊 Live</Badge>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'activity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Chat & FAQ activity — last 14 days</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="chats" name="AI Chats" fill="#2D6FE8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="faqs" name="New FAQs" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {activeTab === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">FAQ distribution by category</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {categoryPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {activeTab === 'peak' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Chat activity by hour of day</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={peakHourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" name="Chats" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3, fill: '#8B5CF6' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </GlassCard>
  )
}