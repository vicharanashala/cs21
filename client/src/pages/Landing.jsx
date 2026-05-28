import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import { GITHUB_PROFILE_URL, GITHUB_USERNAME } from '../config/github'
import { useTheme } from '../context/ThemeContext'
import { MessageSquare, BookOpen, Shield, Zap, Search, Mic, Moon, Sun, ArrowRight, Users, Brain, Sparkles } from 'lucide-react'

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
  { value: '50+', label: 'Categories' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<2s', label: 'Avg Response' },
]

export default function Landing() {
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Crowd</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
            <Zap size={14} />
            AI-powered knowledge portal
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
            The FAQ portal that
            <span className="text-brand-600 dark:text-brand-400 block">grows itself</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Ask questions, get instant AI answers, and watch the knowledge base expand — automatically. No duplicates, no clutter.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              Start Using Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mb-1">{value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Everything you need
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              A modern AI-powered knowledge platform built for communities and teams.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-brand-600 dark:bg-brand-900">
        <div className="max-w-3xl mx-auto text-center">
          <Users size={40} className="mx-auto text-white/60 mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready to get answers?</h2>
          <p className="text-brand-100 mb-8">
            Join thousands of users who get instant answers and contribute to the growing knowledge base.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">Crowd FAQ Portal</span>
            <a
              href={GITHUB_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors ml-4"
            >
              <Github size={14} />
              <span>{GITHUB_USERNAME}</span>
            </a>
          </div>
          <p className="text-sm text-gray-400">
            Built with MERN + Firebase + AI · MVP Demo
          </p>
        </div>
      </footer>
    </div>
  )
}