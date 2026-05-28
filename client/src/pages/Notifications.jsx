import { SmartNotifications } from '../components/dashboard/SmartNotifications'

export default function Notifications() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">AI-powered alerts and system updates</p>
      </div>
      <SmartNotifications />
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Notification Settings</h2>
        <div className="space-y-3">
          {[
            { label: 'Duplicate detection alerts', desc: 'Get notified when similar FAQs are detected', defaultChecked: true },
            { label: 'Spam detection alerts', desc: 'Admin notifications for flagged content', defaultChecked: true },
            { label: 'AI low-confidence warnings', desc: 'When draft answers need human review', defaultChecked: true },
            { label: 'Trending topic alerts', desc: 'Surge in searches for a topic', defaultChecked: false },
          ].map(({ label, desc, defaultChecked }) => (
            <label key={label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <input type="checkbox" defaultChecked={defaultChecked}
                className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}