import { Link } from 'react-router-dom'
import { ArrowUp, Eye, MessageCircle, Globe } from 'lucide-react'

const LANG_FLAGS = {
  en: '🇬🇧', hi: '🇮🇳', es: '🇪🇸', fr: '🇫🇷',
  ar: '🇸🇦', zh: '🇨🇳', de: '🇩🇪', pt: '🇧🇷',
}

export default function FAQCard({ faq, isNew = false, viewLang = 'en' }) {
  const accentBorder = isNew ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--border)'

  return (
    <div style={{
      background: 'var(--surface)',
      border: accentBorder,
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: 'var(--shadow-xs)',
      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      e.currentTarget.style.borderColor = 'var(--border-hover)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
      e.currentTarget.style.borderColor = isNew ? 'rgba(139,92,246,0.3)' : 'var(--border)'
    }}
    >
      {/* Subtle top accent for AI cards */}
      {faq.isAI && !isNew && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
          borderRadius: '12px 12px 0 0',
        }} />
      )}
      {isNew && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
          borderRadius: '12px 12px 0 0',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <Link
          to={`/faqs/${faq._id}`}
          style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text)',
            textDecoration: 'none', letterSpacing: '-0.01em',
            lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            flex: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
        >
          {faq.question}
        </Link>
        {faq.isAI && !isNew && (
          <span style={{
            fontSize: 10, fontWeight: 600,
            background: '#F5F3FF', color: '#7C3AED',
            padding: '2px 7px', borderRadius: 10,
            flexShrink: 0, letterSpacing: 0,
          }}>
            🤖 AI
          </span>
        )}
        {isNew && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            background: '#F5F3FF', color: '#7C3AED',
            padding: '2px 7px', borderRadius: 10,
            flexShrink: 0, border: '1px solid rgba(139,92,246,0.2)',
            letterSpacing: 0,
          }}>
            ✨ New
          </span>
        )}
        {viewLang !== 'en' && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 600,
            background: 'var(--surface-2)', color: 'var(--text-3)',
            padding: '2px 7px', borderRadius: 8, flexShrink: 0,
          }}>
            <Globe size={10} />
            {LANG_FLAGS[viewLang] || viewLang.toUpperCase()}
          </span>
        )}
      </div>

      {/* Answer preview */}
      <p style={{
        fontSize: 13, color: 'var(--text-2)',
        lineHeight: 1.55,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        marginBottom: 14,
      }}>
        {faq.answer}
      </p>

      {/* Footer row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 500,
            background: 'var(--surface-2)', color: 'var(--text-2)',
            padding: '2px 8px', borderRadius: 5,
          }}>
            {faq.category}
          </span>
          {faq.tags?.slice(0, 3).map(tag => (
            <span
              key={tag}
              style={{
                fontSize: 10, color: 'var(--accent)',
                background: 'var(--accent-bg)',
                padding: '2px 6px', borderRadius: 4,
                fontWeight: 500,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {[
            { icon: ArrowUp,    value: faq.votes || 0  },
            { icon: Eye,        value: faq.views || 0  },
            { icon: MessageCircle, value: faq.comments?.length || 0 },
          ].map(({ icon: Icon, value }) => (
            <div key={Icon.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon size={11} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}