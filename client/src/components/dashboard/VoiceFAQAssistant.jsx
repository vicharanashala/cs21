import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, Badge } from '../ui/GlassCard'
import { Mic, MicOff, Send, Loader, Volume2 } from 'lucide-react'

const API = '/api'
const token = () => localStorage.getItem('token')

export function VoiceFAQAssistant() {
  const [listening, setListening] = useState(false)
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Speech recognition not supported in this browser'); return }

    const recognition = new SpeechRecognition()
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
    recognition.onerror = () => { setListening(false); setError('Microphone error') }
    recognition.onend = () => setListening(false)

    recognition.start()
    setListening(true)
    setError('')
  }

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false) }

  const speak = (text) => {
    if (!text) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.1
    utterance.pitch = 1
    synthRef.current.cancel()
    synthRef.current.speak(utterance)
    setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
  }

  const handleSend = async (text) => {
    if (!text?.trim() || loading) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReply(data.reply)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => () => { synthRef.current?.cancel() }, [])

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mic size={18} className="text-brand-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Voice FAQ Assistant</h2>
        </div>
        <Badge variant="default">🎤 Voice</Badge>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Click the mic and ask a question — your voice will be transcribed and sent to the AI.</p>

        {/* Mic button */}
        <div className="flex items-center justify-center py-4">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={listening ? stopListening : startListening}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              listening
                ? 'bg-red-500 animate-pulse shadow-red-200 dark:shadow-red-900/30'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-brand-900/30'
            }`}
          >
            {listening ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-400">{listening ? 'Listening... tap to stop' : 'Tap mic to speak'}</p>

        {/* Text input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Or type your question..."
            className="input-field text-sm"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 shrink-0 disabled:opacity-50"
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {/* Response */}
        {reply && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800"
          >
            <div className="flex items-center justify-between mb-2">
              <Badge variant="ai">🤖 AI Response</Badge>
              <button onClick={() => speak(reply)} className="text-brand-600 hover:text-brand-700">
                <Volume2 size={16} />
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{reply}</p>
          </motion.div>
        )}

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>
    </GlassCard>
  )
}