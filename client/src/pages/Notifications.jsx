import { SmartNotifications } from '../components/dashboard/SmartNotifications'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = ['All', 'AI Alerts', 'Security', 'Updates']

const SETTINGS_GROUPS = [
  {
    label: 'Content Monitoring',
    settings: [
      { label: 'Duplicate detection alerts', desc: 'Get notified when similar FAQs are detected', defaultChecked: true },
      { label: 'Spam detection alerts', desc: 'Admin notifications for flagged content', defaultChecked: true },
    ],
  },
  {
    label: 'AI & Insights',
    settings: [
      { label: 'AI low-confidence warnings', desc: 'When draft answers need human review', defaultChecked: true },
      { label: 'Trending topic alerts', desc: 'Surge in searches for a topic', defaultChecked: false },
    ],
  },
]

function Toggle({ defaultChecked = false }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => setOn(o => !o)}
      className="relative w-10 h-5.5 shrink-0 rounded-full transition-colors duration-300 focus:outline-none"
      style={{
        background: on ? 'var(--accent)' : 'var(--surface-4)',
        boxShadow: on ? '0 0 10px rgba(124,92,252,0.4)' : 'none',
      }}
    >
      <motion.span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ left: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ left: on ? 22 : 2 }}
      />
    </button>
  )
}

function SettingRow({ label, desc }) {
  return (
    <div className="flex items-center justify-between py-3 px-1 hover:bg-white/5 rounded-lg transition-colors group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</p>
      </div>
      <Toggle />
    </div>
  )
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState(0)

  const tabIndex = TABS.indexOf(TABS[activeTab])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px 48px' }}>
      {/* Page Header */}
      <div className="text-center mb-8 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-4)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--accent)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>Live monitoring</span>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          Notifications
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: 14 }}>
          Stay updated with AI alerts
        </p>
      </div>

      {/* Tab Bar */}
      <div
        className="mb-6 p-1 rounded-xl flex items-center gap-1"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--surface-4)' }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className="flex-1 relative py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
            style={{
              color: activeTab === i ? '#fff' : 'var(--text-3)',
              background: activeTab === i ? 'var(--accent)' : 'transparent',
              boxShadow: activeTab === i ? '0 0 16px rgba(124,92,252,0.35)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Smart Notifications */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--surface-4)' }}
      >
        <SmartNotifications />
      </div>

      {/* Settings Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--surface-4)' }}
      >
        {/* Settings Header */}
        <div className="px-5 pt-5 pb-3" style={{ borderBottom: '1px solid var(--surface-4)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Notification Settings
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            Manage what alerts you receive
          </p>
        </div>

        <div className="p-5 space-y-6">
          {SETTINGS_GROUPS.map(group => (
            <div key={group.label}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-3)' }}
              >
                {group.label}
              </p>
              <div className="divide-y" style={{ borderColor: 'var(--surface-4)' }}>
                {group.settings.map(s => (
                  <SettingRow key={s.label} label={s.label} desc={s.desc} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}