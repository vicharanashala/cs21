import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const COLORS = ['#7C5CFC', '#38BDF8', '#34D399', '#FBBF24', '#F87171', '#F472B6']

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-hover)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text)',
  boxShadow: 'var(--shadow-md)',
  padding: '8px 12px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

export function AIUsageAnalytics({ refreshKey = 0 }) {
  const [chatByDay, setChatByDay]         = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('activity')

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const d = await res.json()

      const fourteenDays = buildLast14Days()
      const chatMap = Object.fromEntries(Object.entries(d.chatByDay || {}).slice(-14))
      const userMap = Object.fromEntries(Object.entries(d.userByDay || {}).slice(-14))
      fourteenDays.forEach(day => {
        day.chats = chatMap[day.date] || 0
        day.faqs  = userMap[day.date] || 0
      })
      setChatByDay(fourteenDays)
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
    { key: 'activity',   label: 'Activity'        },
    { key: 'categories', label: 'Categories'      },
    { key: 'dow',        label: 'By Day of Week'  },
  ]

  const tabBtn = (key) => ({
    padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
    transition: 'all 0.16s ease',
    background: activeTab === key ? 'var(--accent)' : 'var(--surface-2)',
    color: activeTab === key ? '#fff' : 'var(--text-2)',
    boxShadow: activeTab === key ? '0 2px 10px rgba(124,92,252,0.35)' : 'none',
    letterSpacing: '0.01em',
  })

  const shortTick = (str) => {
    const parts = str?.split(' ') || []
    return parts[parts.length - 1] || str
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={tabBtn(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      {loading ? (
        <div style={{
          height: 240,
          background: 'var(--surface-2)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>Loading analytics…</span>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'activity' && (
            <div>
              {/* Summary metric strip */}
              {chatByDay.length > 0 && (() => {
                const totalChats = chatByDay.reduce((s, d) => s + d.chats, 0)
                const totalFAQs  = chatByDay.reduce((s, d) => s + d.faqs, 0)
                const peak       = Math.max(...chatByDay.map(d => d.chats), 1)
                const peakDay    = chatByDay.find(d => d.chats === peak)?.name || '—'
                const todayChats = chatByDay[chatByDay.length - 1]?.chats || 0
                return (
                  <div style={{
                    display: 'flex', gap: 0,
                    marginBottom: 16,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    background: 'var(--surface-2)',
                  }}>
                    {[
                      { label: 'Total Chats',  value: totalChats.toLocaleString(), color: '#7C5CFC' },
                      { label: 'New FAQs',     value: totalFAQs.toLocaleString(),  color: '#34D399' },
                      { label: "Today's Chats", value: todayChats.toLocaleString(), color: '#38BDF8' },
                      { label: 'Peak Day',     value: peakDay,                      color: '#FBBF24' },
                    ].map(({ label, value, color }, idx, arr) => (
                      <div key={label} style={{
                        flex: 1, padding: '12px 16px',
                        borderRight: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', flexDirection: 'column', gap: 2,
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: 'var(--text-3)',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>
                          {label}
                        </span>
                        <span style={{
                          fontSize: 18, fontWeight: 800, color,
                          letterSpacing: '-0.03em', lineHeight: 1.2,
                        }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <p style={{
                fontSize: 10, color: 'var(--text-3)',
                fontWeight: 500, marginBottom: 10,
                letterSpacing: '0.02em',
              }}>
                Daily AI chats and new FAQs — last 14 days
              </p>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chatByDay} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={shortTick}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: 'var(--surface-3)', radius: 4 }}
                  />
                  <Bar
                    dataKey="chats" name="AI Chats"
                    fill="#7C5CFC"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="faqs" name="New FAQs"
                    fill="#34D399"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <p style={{
                fontSize: 10, color: 'var(--text-3)',
                fontWeight: 500, marginBottom: 10,
              }}>
                FAQ distribution by category
              </p>
              {categoryBreakdown.length === 0 ? (
                <div style={{
                  height: 200,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface-2)', borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No category data yet</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%" cy="50%"
                        innerRadius={52}
                        outerRadius={84}
                        dataKey="value"
                        paddingAngle={3}
                        stroke="none"
                      >
                        {categoryBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v, n) => [v, n]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', gap: 9,
                  }}>
                    {categoryBreakdown.map((cat, i) => (
                      <div key={cat.name} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{
                          width: 9, height: 9, borderRadius: 2, flexShrink: 0,
                          background: COLORS[i % COLORS.length],
                          boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}50`,
                        }} />
                        <span style={{
                          flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {cat.name}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                          letterSpacing: '-0.02em',
                        }}>
                          {cat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dow' && (
            <div>
              <p style={{
                fontSize: 10, color: 'var(--text-3)',
                fontWeight: 500, marginBottom: 10,
              }}>
                Total chats by day of week — last 14 days
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dayOfWeekData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Chats"
                    stroke="#7C5CFC"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#7C5CFC', strokeWidth: 0 }}
                    activeDot={{
                      r: 6,
                      fill: '#7C5CFC',
                      stroke: 'var(--surface)',
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
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
    days.push({
      date: d.toISOString().split('T')[0],
      name: comma !== -1 ? name.slice(0, comma) : name,
      chats: 0,
      faqs: 0,
    })
  }
  return days
}