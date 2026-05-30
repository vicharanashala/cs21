import { motion } from 'framer-motion'

// ── Base card ──────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick, style = {}, hoverable = false }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-xs)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        ...(hoverable ? {
          cursor: 'pointer',
        } : {}),
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.borderColor = 'var(--border-hover)'
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
        e.currentTarget.style.borderColor = 'var(--border)'
      } : undefined}
    >
      {children}
    </div>
  )
}

// ── Motion card ───────────────────────────────────────────────────────
export function MotionCard({ children, className = '', whileHover, ...props }) {
  return (
    <motion.div
      whileHover={whileHover || { scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-xs)',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ── Stat card ──────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, bg, iconColor, trend, trendUp }) {
  return (
    <Card style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: bg || 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={13} style={{ color: iconColor || 'var(--text-2)' }} />
          </div>
        )}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 800,
        color: 'var(--text)', letterSpacing: '-0.04em',
        lineHeight: 1,
        marginTop: 4,
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
      </div>
      {trend && (
        <div style={{
          fontSize: 11, fontWeight: 600,
          color: trendUp ? '#059669' : '#DC2626',
          display: 'flex', alignItems: 'center', gap: 3,
          marginTop: 2,
        }}>
          <span>{trendUp ? '↑' : '↓'}</span>
          <span>{trend}</span>
        </div>
      )}
    </Card>
  )
}

// ── Badge ──────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', dot = false, className = '' }) {
  const variants = {
    default:  { bg: 'var(--surface-2)', color: 'var(--text-2)' },
    accent:   { bg: 'var(--accent-bg)', color: 'var(--accent)' },
    success:  { bg: 'var(--success-bg)', color: 'var(--success)' },
    warning:  { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    danger:   { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    purple:   { bg: '#F5F3FF', color: '#7C3AED' },
    ai:       { bg: '#F5F3FF', color: '#7C3AED' },
  }
  const v = variants[variant] || variants.default
  return (
    <span
      className={`badge ${className}`}
      style={{ background: v.bg, color: v.color }}
    >
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'currentColor', display: 'inline-block',
        }} />
      )}
      {children}
    </span>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = { sm: 24, md: 32, lg: 40, xl: 56 }
  const px = sizes[size] || sizes.md
  const colors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2']
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div
      className={`avatar ${className}`}
      style={{ width: px, height: px, background: c, fontSize: px * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────
export function Skeleton({ className = '', height = 12, style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, borderRadius: 4, ...style }}
    />
  )
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      <Skeleton width="50%" height={10} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={`${65 + Math.random() * 35}%`} height={10} />
      ))}
    </Card>
  )
}

// ── Empty state ────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className="empty-state" style={compact ? { padding: '20px 16px' } : {}}>
      {Icon && <Icon size={compact ? 22 : 28} style={{ color: 'var(--text-3)', marginBottom: 4 }} />}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--accent)', className = '' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={className} style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  )
}

export function ConfidenceBar({ confidence }) {
  const color = confidence >= 85 ? '#059669' : confidence >= 60 ? '#D97706' : '#DC2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${confidence}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>
        {confidence}%
      </span>
    </div>
  )
}

// ── Spinner ────────────────────────────────────────────────────────────
export function Spinner({ size = 18, className = '' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}