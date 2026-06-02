import { motion } from 'framer-motion'

// ── Base card ─────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick, style = {}, hoverable = false }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        ...(hoverable ? { cursor: 'pointer' } : {}),
        ...style,
      }}
      onMouseEnter={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderColor = 'var(--border-hover)'
      } : undefined}
      onMouseLeave={hoverable ? (e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
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
      whileHover={whileHover || { scale: 1.003 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: 'var(--shadow-sm)',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, bg, iconColor, trend, trendUp }) {
  return (
    <Card style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: bg || 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={13} style={{ color: iconColor || 'var(--text-2)' }} />
          </div>
        )}
      </div>
      <div style={{
        fontSize: 30, fontWeight: 800,
        color: 'var(--text)', letterSpacing: '-0.04em',
        lineHeight: 1,
        marginTop: 2,
      }}>
        {typeof value === 'number' ? value.toLocaleString() : value ?? '—'}
      </div>
      {trend && (
        <div style={{
          fontSize: 11, fontWeight: 700,
          color: trendUp ? 'var(--success)' : 'var(--danger)',
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

// ── Badge ─────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', dot = false, className = '' }) {
  const variants = {
    default:  { bg: 'var(--surface-3)', color: 'var(--text-2)' },
    accent:   { bg: 'var(--accent-dim)', color: 'var(--accent)' },
    success:  { bg: 'var(--success-dim)', color: 'var(--success)' },
    warning:  { bg: 'var(--warning-dim)', color: 'var(--warning)' },
    danger:   { bg: 'var(--danger-dim)', color: 'var(--danger)' },
    info:     { bg: 'var(--info-dim)', color: 'var(--info)' },
    ai:       { bg: 'var(--accent-dim)', color: 'var(--accent)' },
  }
  const v = variants[variant] || variants.default
  return (
    <span className={`badge ${className}`} style={{ background: v.bg, color: v.color }}>
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
  const px    = sizes[size] || sizes.md
  const colors = ['#7C5CFC', '#38BDF8', '#34D399', '#FBBF24', '#F87171', '#06B6D4']
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: px, height: px,
        background: `${c}25`,
        color: c,
        fontSize: px * 0.36,
        fontWeight: 700,
        border: `1.5px solid ${c}40`,
      }}
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

// ── Empty state ───────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action, compact = false }) {
  return (
    <div className="empty-state" style={compact ? { padding: '20px 16px' } : {}}>
      {Icon && (
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 4,
        }}>
          <Icon size={20} style={{ color: 'var(--text-3)' }} />
        </div>
      )}
      <strong style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{title}</strong>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
        <div>
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            letterSpacing: '-0.01em',
          }}>
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
    <div className={className} style={{
      height: 5, background: 'var(--surface-3)',
      borderRadius: 3, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color,
        borderRadius: 3, transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </div>
  )
}

export function ConfidenceBar({ confidence }) {
  const color = confidence >= 85 ? 'var(--success)'
    : confidence >= 60 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        flex: 1, height: 5, background: 'var(--surface-3)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${confidence}%`,
          background: color, borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{
        fontSize: 11, fontWeight: 700, color,
        width: 36, textAlign: 'right',
        letterSpacing: '-0.02em',
      }}>
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