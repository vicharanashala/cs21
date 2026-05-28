import { motion } from 'framer-motion'

export function GlassCard({ children, className = '', hover = true, onClick, ...props }) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/70 dark:bg-gray-900/70
        backdrop-blur-xl border border-white/20 dark:border-gray-800/30
        shadow-sm hover:shadow-lg
        transition-shadow duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={className.includes('h-full') ? { height: '100%' } : undefined}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </motion.div>
  )
}

export function StatCard({ label, value, icon: Icon, color = 'text-brand-600', trend, trendUp }) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={18} className={color} />}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      {trend && (
        <div className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{trend}</span>
        </div>
      )}
    </GlassCard>
  )
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300',
    success: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    danger: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    purple: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
    ai: 'bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/30 dark:to-indigo-900/30 text-violet-700 dark:text-violet-300',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-12 h-12 text-lg' }
  const colors = ['bg-brand-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-cyan-600']
  const colorIndex = (name?.charCodeAt(0) || 0) % colors.length
  return (
    <div className={`${sizes[size]} ${colors[colorIndex]} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

export function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <GlassCard className="p-5 space-y-3">
      <Skeleton lines={1} className="w-3/4" />
      <Skeleton lines={2} />
      <div className="flex justify-between items-center pt-1">
        <Skeleton lines={1} className="w-20" />
        <Skeleton lines={1} className="w-24" />
      </div>
    </GlassCard>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && <Icon size={40} className="text-gray-200 dark:text-gray-700 mb-3" />}
      <h3 className="text-base font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function ProgressBar({ value, max = 100, color = 'bg-brand-500', className = '' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={`h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ${className}`}>
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function ConfidenceBar({ confidence }) {
  const color = confidence >= 85 ? 'bg-emerald-500' : confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${confidence}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-500 w-10 text-right">{confidence}%</span>
    </div>
  )
}

export function Spinner({ size = 16 }) {
  return (
    <div className="animate-spin" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" className="text-brand-600">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}