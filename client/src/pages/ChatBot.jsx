import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Send, Loader, Mic, MicOff, X, Sparkles,
  ChevronDown, ArrowDown, MessageSquare,
} from 'lucide-react'
import { marked } from 'marked'
import './ChatBot.css'

marked.setOptions({ breaks: true, gfm: true })
const API = '/api'
const ACCENT = '#7C5CFC'

// ── Helpers ─────────────────────────────────────────────────────────────
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror   = reject
    reader.readAsDataURL(blob)
  })
}

function renderMarkdown(text) {
  return marked.parse(text)
}

// ── AI Avatar ────────────────────────────────────────────────────────────
function AI_Avatar({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7C5CFC 0%, #38BDF8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 16px rgba(124,92,252,0.4)',
      flexShrink: 0,
    }}>
      <Sparkles size={size * 0.44} color="#fff" />
    </div>
  )
}

// ── User Avatar ─────────────────────────────────────────────────────────
function UserAvatar({ name, size = 36 }) {
  const colors = ['#7C5CFC', '#38BDF8', '#34D399', '#FBBF24']
  const c = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: `${c}25`,
      border: `1.5px solid ${c}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36,
      fontWeight: 800,
      color: c,
      flexShrink: 0,
      letterSpacing: '-0.02em',
    }}>
      {name?.[0]?.toUpperCase() || 'U'}
    </div>
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--text-3)',
            animation: `bounce-dots 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ── Source badge ─────────────────────────────────────────────────────────
function SourceBadge({ source, similarity, isDuplicate }) {
  if (!source) return null
  const isExisting = source === 'existing'

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: isExisting ? (isDuplicate ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.12)') : 'rgba(52,211,153,0.12)',
      border: `1px solid ${isExisting ? (isDuplicate ? 'rgba(251,191,36,0.3)' : 'rgba(56,189,248,0.3)') : 'rgba(52,211,153,0.3)'}`,
      color: isExisting ? (isDuplicate ? '#FBBF24' : '#38BDF8') : '#34D399',
    }}>
      <span style={{ fontSize: 12 }}>{isExisting ? '♻️' : '✨'}</span>
      {isExisting ? (
        isDuplicate ? (
          <>Duplicate · {Math.round(similarity * 100)}% match</>
        ) : (
          <>Existing FAQ · {Math.round(similarity * 100)}% match</>
        )
      ) : (
        'New FAQ created'
      )}
    </div>
  )
}

// ── Duplicate info banner ─────────────────────────────────────────────────
function DuplicateBanner({ question, similarity, onBrowse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        margin: '8px 20px',
        borderRadius: 12,
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.25)',
      }}
    >
      <span style={{ fontSize: 18 }}>🔁</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24', margin: '0 0 2px' }}>
          This question already exists
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
          Similar question <em>"{question?.slice(0, 50)}{question?.length > 50 ? '…' : ''}"</em> found · {Math.round(similarity * 100)}% match · moved to top of Browse FAQ for 90 min
        </p>
      </div>
      <button
        onClick={onBrowse}
        style={{
          padding: '5px 12px',
          borderRadius: 8,
          background: 'rgba(251,191,36,0.15)',
          border: '1px solid rgba(251,191,36,0.3)',
          color: '#FBBF24',
          fontSize: 11,
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,191,36,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(251,191,36,0.15)'}
      >
        View FAQ →
      </button>
    </motion.div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────
function EmptyState({ onExampleClick }) {
  const examples = [
    'How do I reset my password?',
    'What payment methods do you accept?',
    'Can I cancel my subscription anytime?',
  ]
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(56,189,248,0.15))',
        border: '1px solid rgba(124,92,252,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
        boxShadow: '0 0 32px rgba(124,92,252,0.2)',
      }}>
        <Sparkles size={32} style={{ color: ACCENT }} />
      </div>
      <h2 style={{
        fontSize: 20, fontWeight: 800, color: 'var(--text)',
        letterSpacing: '-0.03em', marginBottom: 6,
      }}>
        Ask the FAQ Assistant
      </h2>
      <p style={{
        fontSize: 13, color: 'var(--text-3)', maxWidth: 320,
        lineHeight: 1.6, marginBottom: 28,
      }}>
        Get instant answers. FAQs are auto-created and added to the knowledge base.
      </p>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 380,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Try an example
        </p>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(ex)}
            style={{
              padding: '10px 16px', borderRadius: 12,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              fontSize: 13, color: 'var(--text-2)',
              fontFamily: 'inherit', cursor: 'pointer',
              textAlign: 'left', fontWeight: 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-3)'
              e.currentTarget.style.color = 'var(--text)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.color = 'var(--text-2)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function ChatBot({ onFaqCreated }) {
  const { user }                  = useAuth()
  const [messages, setMessages]   = useState([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [chatId, setChatId]       = useState(null)
  const [recording, setRecording] = useState(false)
  const [source, setSource]       = useState(null)
  const [similarity, setSimilarity] = useState(null)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)

  const bottomRef     = useRef(null)
  const inputRef      = useRef(null)
  const mediaRef      = useRef(null)
  const chatRef       = useRef(null)
  const inputAreaRef  = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Scroll to bottom when new message arrives while not at bottom
  useEffect(() => {
    const el = chatRef.current
    if (!el) return
    const onScroll = () => setShowScrollBtn(el.scrollTop + el.clientHeight < el.scrollHeight - 80)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // Load history
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${API}/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const data = await res.json()
        const open  = data.chats?.find(c => !c.resolved)
        if (open?.messages?.length > 0) {
          setMessages(open.messages.map(m => ({ role: m.role, content: m.content })))
          setChatId(open._id)
        }
      } catch {}
    })()
  }, [])

  // Voice
  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm'
      const chunks   = []
      const rec      = new MediaRecorder(stream, { mimeType })
      const interimMsgs = []

      setInterimText('')

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SR) {
        const recognition = new SR()
        recognitionRef.current = recognition
        recognition.lang = 'en-US'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = event => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript
            if (event.results[i].isFinal) interimMsgs.push(t)
            else setInterimText(t)
          }
        }
        recognition.onerror = () => recognition.stop()
        recognition.onend = () => recognition.stop()
        recognition.start()
      }

      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        if (recognitionRef.current) recognitionRef.current.stop()
        setRecording(false)
        const blob = new Blob(chunks, { type: mimeType })
        blobToBase64(blob).then(b64 => {
          const text = interimMsgs.join(' ').trim()
          handleSend(null, b64, text)
        })
      }

      rec.start()
      setRecording(true)
      mediaRef.current = rec
    } catch {
      setError('Microphone access denied.')
      setRecording(false)
    }
  }

  const stopRecording = () => {
    mediaRef.current?.state !== 'inactive' && mediaRef.current?.stop()
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const handleSend = async (e, voiceBase64 = null, spokenText = null) => {
    if (e) e.preventDefault()
    const text = spokenText || (voiceBase64 ? null : input.trim())
    if ((!text && !voiceBase64) || loading) return

    if (!voiceBase64) setInput('')
    setError('')
    setLoading(true)
    setSource(null)
    setIsDuplicate(false)

    const content = spokenText
      ? `🎤 ${spokenText}`
      : voiceBase64 ? '🎤 [Voice message]' : input.trim()

    setMessages(prev => [...prev, { role: 'user', content }])

    try {
      const body = voiceBase64 ? { voiceData: voiceBase64 } : { message: text }
      const res  = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      if (data.chatId)     setChatId(data.chatId)
      if (data.source)     setSource(data.source)
      if (typeof data.similarity === 'number') setSimilarity(data.similarity)
      if (data.isDuplicate) setIsDuplicate(true)

      const aiMsg = `**Q:** ${data.question}\n\n**A:** ${data.reply}`
      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }])
      if (onFaqCreated && data.isNew) onFaqCreated(data)
    } catch (err) {
      setError(err.message)
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="chatbot-shell">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="chatbot-header">
        <div className="chatbot-header-left">
          <AI_Avatar size={38} />
          <div>
            <h1 className="chatbot-title">FAQ Assistant</h1>
            <div className="chatbot-status">
              <span className="status-dot" />
              <span className="status-text">Online · Qwen2.5 3B</span>
            </div>
          </div>
        </div>
        <div className="chatbot-header-right">
          <span className="model-badge">
            <Sparkles size={10} />
            Qwen2.5 3B
          </span>
        </div>
      </header>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div className="chatbot-messages" ref={chatRef}>
        {messages.length === 0 ? (
          <EmptyState onExampleClick={text => { setInput(text); inputRef.current?.focus() }} />
        ) : (
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message-row ${msg.role === 'user' ? 'message-row--user' : ''}`}
              >
                {msg.role === 'assistant' && <AI_Avatar size={34} />}
                <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
                  {msg.role === 'assistant' ? (
                    <div
                      className="prose-content"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{msg.content}</span>
                  )}
                </div>
                {msg.role === 'user' && <UserAvatar name={user?.name} size={34} />}
              </div>
            ))}

            {loading && (
              <div className="message-row">
                <AI_Avatar size={34} />
                <div className="bubble-ai" style={{ padding: '14px 18px' }}>
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollBtn && messages.length > 0 && (
          <button className="scroll-btn" onClick={scrollToBottom}>
            <ArrowDown size={14} />
          </button>
        )}
      </div>

      {/* ── Duplicate / source info strip ───────────────────────── */}
      {isDuplicate ? (
        <DuplicateBanner
          question={messages[messages.length - 1]?.content?.match(/\*\*Q:\*\* (.+)/)?.[1] || ''}
          similarity={similarity}
          onBrowse={() => window.location.href = '/faqs'}
        />
      ) : (
        <SourceBadge source={source} similarity={similarity} isDuplicate={false} />
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="chatbot-error">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={13} /></button>
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────────── */}
      <div className="chatbot-input-area">
        {recording && (
          <div className="recording-indicator">
            <span className="rec-dot" />
            <span>Listening… {interimText && <span className="rec-transcript">"{interimText}"</span>}</span>
            <button className="rec-stop" onClick={stopRecording}><MicOff size={13} /> Stop</button>
          </div>
        )}

        <form className="input-row" onSubmit={handleSend}>
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
              rows={1}
              className="chat-textarea"
            />
          </div>

          <div className="input-actions">
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              className={`mic-btn ${recording ? 'mic-btn--recording' : ''}`}
              title={recording ? 'Stop recording' : 'Voice input'}
            >
              {recording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="send-btn"
            >
              <Send size={18} />
            </button>
          </div>
        </form>

        <p className="input-hint">FAQ Assistant generates answers — similar questions reuse existing FAQs.</p>
      </div>
    </div>
  )
}