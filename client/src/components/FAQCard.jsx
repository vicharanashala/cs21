import { ArrowUp, Eye, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FAQCard({ faq }) {
  return (
    <div className="card p-5 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          to={`/faqs/${faq._id}`}
          className="text-base font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-2"
        >
          {faq.question}
        </Link>
        {faq.isAI && (
          <span className="shrink-0 badge">🤖 AI</span>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
        {faq.answer}
      </p>
      <div className="flex items-center justify-between">
        <span className="badge">{faq.category}</span>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <ArrowUp size={12} /> {faq.votes || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {faq.views || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} /> {faq.comments?.length || 0}
          </span>
        </div>
      </div>
      {faq.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {faq.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}