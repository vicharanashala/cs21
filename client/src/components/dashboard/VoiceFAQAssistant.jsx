import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '../ui/GlassCard'
import { Mic, MicOff, Send, Loader, Volume2 } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function VoiceFAQAssistant() {
  const [listening, setListening] = useState(false)
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

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
    recognition.onerror = () => { setListening(false); setError(true) }
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
    setError(false)
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const speak = (text) => {
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.1
    synthRef.current.cancel()
    synthRef.current.speak(utterance)
    utterance.onend = () => {}
  }

  const handleSend = async (text) => {
    if (!text?.trim() || loading) return
    setLoading(true); setError(false)
    try {
      const res = await fetch(`${API}/chat`, {
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

  useEffect(() => () => { synthRef.current?.cancel() }, [])

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Mic zone */}
        <div className="flex flex-col items-center gap-2 py-3 sm:py-0 sm:justify-center">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={listening ? stopListening : startListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
              listening
                ? 'bg-red-500 animate-pulse shadow-red-200 dark:shadow-red-900/30'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-brand-900/30'
            }`}
          >
            {listening ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
          </motion.button>
          <p className="text-[11px] text-gray-400 text-center">
            {listening ? 'Listening…' : 'Tap to speak'}
          </p>
        </div>

        {/* Input + response */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              placeholder="Or type your question…"
              className="input-field text-[13px]"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 shrink-0 disabled:opacity-50"
            >
              {loading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>

          {reply && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800"
            >
              <div className="flex items-center justify-between mb-1.5">
                <Badge variant="ai">🤖 AI</Badge>
                <button onClick={() => speak(reply)} className="text-brand-600 hover:text-brand-700 p-1">
                  <Volume2 size={13} />
                </button>
              </div>
              <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{reply}</p>
            </motion.div>
          )}

          {error && (
            <p className="text-[11px] text-red-500">Failed to get response. Check the server.</p>
          )}
        </div>
      </div>
    </div>
  )
}