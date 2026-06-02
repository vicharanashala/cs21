import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../ui/GlassCard'
import { Mic, MicOff, Send, Loader, Volume2 } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function VoiceFAQAssistant() {
  const [listening, setListening] = useState(false)
  const [input, setInput]         = useState('')
  const [reply, setReply]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(false)
  const recognitionRef = useRef(null)
  const synthRef       = useRef(window.speechSynthesis)

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError(true); return }

    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setListening(false)
      handleSend(transcript)
    }
    recognition.onerror  = () => { setListening(false); setError(true) }
    recognition.onend    = () => setListening(false)
    recognition.start()
    setListening(true)
    setError(false)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const speak = (text) => {
    if (!text) return
    synthRef.current.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.1
    synthRef.current.speak(u)
  }

  const handleSend = async (text) => {
    if (!text?.trim() || loading) return
    setLoading(true); setError(false)
    try {
      const res  = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReply(data.reply)
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      padding: 20, background: 'var(--surface)',
      border: '1px solid var(--border)', borderRadius: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(56,189,248,0.15))',
          border: '1px solid rgba(124,92,252,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 17 }}>🎙️</span>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Voice FAQ Assistant
          </p>
          <p style={{ fontSize: 10, color: 'var(--text-3)' }}>Speak or type your question</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {/* Mic */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={listening ? stopListening : startListening}
          style={{
            width: 50, height: 50, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: listening ? '0 0 16px rgba(248,113,113,0.4)' : '0 2px 10px rgba(124,92,252,0.3)',
            transition: 'all 0.18s ease',
            background: listening ? 'var(--danger)' : 'var(--accent)',
            flexShrink: 0,
            color: '#fff',
          }}
        >
          {listening
            ? <MicOff size={20} />
            : <Mic size={20} />
          }
        </motion.button>

        {/* Input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Or type your question here…"
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12,
              background: 'var(--surface-2)',
              border: '1.5px solid var(--border)',
              fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--border-focus)'
              e.target.style.boxShadow = '0 0 0 3px var(--accent-dim)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border)'
              e.target.style.boxShadow = 'none'
            }}
          />
          <input
            type="submit"
            value={loading ? 'Sending…' : 'Send'}
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s ease',
              opacity: !input.trim() || loading ? 0.4 : 1,
            }}
          />
        </div>
      </div>

      {/* Reply */}
      {reply && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: 14, borderRadius: 14,
            background: 'var(--accent-dim)',
            border: '1px solid rgba(124,92,252,0.2)',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <Badge variant="ai">🤖 AI</Badge>
            <button
              onClick={() => speak(reply)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 8,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Volume2 size={11} /> Listen
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{reply}</p>
        </motion.div>
      )}

      {error && (
        <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 500 }}>
          Microphone access denied or server unavailable.
        </p>
      )}
    </div>
  )
}