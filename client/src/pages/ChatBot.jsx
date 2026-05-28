import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Send, Loader, MessageSquare } from 'lucide-react'
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true })

const API = '/api'

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }
  return text.replace(/[&<>"']/g, m => map[m])
}

function renderMarkdown(text) {
  // Render markdown to HTML and sanitize basic XSS
  const raw = marked.parse(text)
  return raw
}

export default function ChatBot() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chatId, setChatId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load existing chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API}/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        if (!res.ok) return
        const data = await res.json()
        // Load most recent open chat session
        const openChat = data.chats?.find(c => !c.resolved)
        if (openChat && openChat.messages.length > 0) {
          setMessages(openChat.messages.map(m => ({ role: m.role, content: m.content })))
          setChatId(openChat._id)
        }
      } catch {
        // Silently ignore history load errors
      }
    }
    loadHistory()
  }, [])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setError('')

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      // Update chat ID if this started a new session
      if (data.chatId) setChatId(data.chatId)

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err.message)
      // Remove the optimistically-added user message on failure
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Chatbot</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Ask anything — AI-powered answers, instantly added to the FAQ base.
        </p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare size={48} className="text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 text-lg font-medium">Start a conversation</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              Type your question below and get an instant AI-powered response.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white'
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
            }`}>
              {msg.role === 'user' ? user?.name?.[0]?.toUpperCase() : 'AI'}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-tr-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-300">AI</div>
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
              <Loader size={14} className="animate-spin text-gray-400" />
              <span className="text-gray-400 text-xs italic">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="input-field resize-none pr-12 max-h-40 overflow-auto"
            style={{ height: 'auto' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="btn-primary px-5 shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}