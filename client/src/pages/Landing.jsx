import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../config/github'
import { useTheme } from '../context/ThemeContext'
import { MessageSquare, BookOpen, Shield, Zap, Search, Mic, Moon, Sun, ArrowRight, Users, Brain, Sparkles, Check } from 'lucide-react'
import './Landing.css'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Answers',
    desc: 'Get instant responses from our LLM chatbot. Every answer is validated and added to the FAQ base.',
  },
  {
    icon: Shield,
    title: 'Duplicate Prevention',
    desc: 'Semantic similarity detection prevents redundant entries. 85%+ match threshold keeps the knowledge base clean.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    desc: 'Full-text search with auto-complete, related questions, and trending suggestions as you type.',
  },
  {
    icon: Mic,
    title: 'Voice Enabled',
    desc: 'Speak your questions. Speech-to-text and text-to-speech built right into the chat interface.',
  },
  {
    icon: BookOpen,
    title: 'Community FAQs',
    desc: 'Browse, vote on, and comment on community-contributed FAQs organized by category.',
  },
  {
    icon: Sparkles,
    title: 'Auto-Growing Knowledge',
    desc: 'Resolved AI conversations automatically become FAQs after validation — the portal grows itself.',
  },
]

const stats = [
  { value: '10K+', label: 'FAQs Answered' },
  { value: '50+',  label: 'Categories'    },
  { value: '99.9%',label: 'Uptime'        },
  { value: '<2s',  label: 'Avg Response'  },
]

const socialProof = [
  'No setup required',
  'Auto-growing knowledge base',
  'Semantic duplicate detection',
  'Voice & text input',
]

export default function Landing() {
  const { dark, toggle } = useTheme()

  return (
    <div className="landing-root">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">
              <svg viewBox="0 0 28 28" fill="none">
                <rect x="4"  y="4"  width="14" height="14" rx="3" fill="#7C5CFC" />
                <rect x="10" y="10" width="14" height="14" rx="3" fill="#7C5CFC" opacity="0.35" />
              </svg>
            </div>
            <span>Crowd</span>
          </div>
          <div className="landing-nav-actions">
            <button onClick={toggle} className="landing-icon-btn">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/login"   className="landing-btn-secondary">Sign In</Link>
            <Link to="/register"className="landing-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="landing-hero">

        {/* Aurora layers */}
        <div className="aurora" aria-hidden="true">
          <div className="aurora-layer aurora-layer-1" />
          <div className="aurora-layer aurora-layer-2" />
          <div className="aurora-layer aurora-layer-3" />
          <div className="aurora-noise" />
        </div>

        {/* Radial fade overlay for readability */}
        <div className="aurora-fade" aria-hidden="true" />

        <div className="landing-hero-inner">
          {/* Eyebrow pill */}
          <div className="landing-eyebrow">
            <span className="eyebrow-dot" />
            AI-powered knowledge portal
          </div>

          {/* Headline */}
          <h1 className="landing-headline">
            The FAQ portal that
            <br />
            <span className="landing-headline-accent">grows itself</span>
          </h1>

          {/* Sub */}
          <p className="landing-sub">
            Ask questions, get instant AI answers, and watch the knowledge base expand —
            automatically. No duplicates, no clutter.
          </p>

          {/* Social proof strip */}
          <div className="landing-proof">
            {socialProof.map(item => (
              <span key={item} className="proof-item">
                <Check size={12} />
                {item}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="landing-hero-ctas">
            <Link to="/register" className="landing-btn-primary landing-cta-main">
              Start Using Free
              <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="landing-btn-secondary landing-cta-main">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="landing-stats">
        <div className="landing-stats-inner">
          {stats.map(({ value, label }) => (
            <div key={label} className="stat-item">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2>Everything you need</h2>
            <p>A modern AI-powered knowledge platform built for communities and teams.</p>
          </div>
          <div className="features-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="landing-cta-section">
        <div className="cta-glow" aria-hidden="true" />
        <div className="landing-section-inner landing-cta-inner">
          <div className="cta-icon-wrap">
            <Users size={36} />
          </div>
          <h2>Ready to get answers?</h2>
          <p>
            Join thousands of users who get instant answers and contribute to the growing knowledge base.
          </p>
          <Link to="/register" className="landing-btn-cta">
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark" style={{ width: 22, height: 22 }}>
              <svg viewBox="0 0 28 28" fill="none">
                <rect x="4"  y="4"  width="14" height="14" rx="3" fill="#7C5CFC" />
                <rect x="10" y="10" width="14" height="14" rx="3" fill="#7C5CFC" opacity="0.35" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Crowd FAQ Portal</span>
          </div>
          <a
            href={GITHUB_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
          >
            <Github size={13} />
            <span>{GITHUB_USERNAME}</span>
          </a>
          <p>Built with MERN + Firebase + AI · MVP Demo</p>
        </div>
      </footer>
    </div>
  )
}