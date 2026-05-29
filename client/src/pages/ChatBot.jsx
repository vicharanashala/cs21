import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, Loader, Mic, MicOff, Zap } from 'lucide-react';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

const API = '/api';

function renderMarkdown(text) {
  return marked.parse(text);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror   = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe audio using the browser's built-in Web Speech API (SpeechRecognition).
 * Requires Chrome/Edge. Falls back gracefully if unsupported.
 */
function transcribeWithWebSpeech(mediaRecorder, onInterim, onFinal) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.continuous    = true;
  recognition.interimResults = true;
  recognition.lang           = 'en-US';

  let finalTranscript = '';

  // Wire SpeechRecognition to the MediaRecorder stream
  const stream = mediaRecorder?.stream;
  if (!stream) return null;

  // On final transcript — concatenate interim + final
  recognition.onresult = event => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalTranscript += t;
      else interim += t;
    }
    onInterim(interim);
    if (event.results[event.results.length - 1].isFinal) {
      onFinal(finalTranscript.trim());
    }
  };

  recognition.onerror = err => {
    console.error('SpeechRecognition error:', err);
    if (err.error !== 'no-speech') recognition.stop();
  };

  // Capture audio from MediaRecorder stream via AudioContext
  const ctx  = new AudioContext({ sampleRate: 16000 });
  const src  = ctx.createMediaStreamSource(stream);
  const dest = ctx.createMediaStreamDestination();
  src.connect(dest);
  recognition.onend = () => ctx.close().catch(() => {});

  // Start recognition (it will process the routed audio stream)
  try { recognition.start(); } catch (e) { console.warn('Recognition start failed:', e); }

  return recognition; // caller calls .stop() when recording ends
}

export default function ChatBot({ onFaqCreated }) {
  const { user }     = useAuth();
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [chatId, setChatId]         = useState(null);
  const [recording, setRecording]      = useState(false);
  const [source, setSource]          = useState(null);
  const [similarity, setSimilarity]  = useState(null);
  const [category, setCategory]      = useState(null);
  const [transcriptText, setTranscriptText] = useState(''); // live browser transcription
  const [interimText, setInterimText]       = useState(''); // interim results

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const mediaRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load existing chat history
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`${API}/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const open  = data.chats?.find(c => !c.resolved);
        if (open?.messages?.length > 0) {
          setMessages(open.messages.map(m => ({ role: m.role, content: m.content })));
          setChatId(open._id);
        }
      } catch {}
    };
    loadHistory();
  }, []);

  // Voice recording
  const startRecording = async () => {
    try {
      const stream    = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mimeType  = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const chunks    = [];
      const rec       = new MediaRecorder(stream, { mimeType });

      setTranscriptText('');
      setInterimText('');

      // Try browser Web Speech API first (no server round-trip)
      const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

      if (hasSpeechAPI) {
        const interimMsgs = [];
        const recognition  = transcribeWithWebSpeech(rec, 
          interim => setInterimText(interim),
          final   => { interimMsgs.push(final); setTranscriptText(interimMsgs.join(' ')); }
        );

        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        rec.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          if (recognition) recognition.stop();
          setRecording(false);

          const blob = new Blob(chunks, { type: mimeType });
          blobToBase64(blob).then(b64 => {
            const spoken = interimMsgs.join(' ').trim();
            handleSend(null, b64, spoken);
          });
        };
        rec.start();
        setRecording(true);
        mediaRef.current = rec;
      } else {
        // Fallback: send raw audio for server-side transcription
        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        rec.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          setRecording(false);
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const b64  = await blobToBase64(blob);
          await handleSend(null, b64);
        };
        rec.start();
        setRecording(true);
        mediaRef.current = rec;
      }
    } catch {
      setError('Microphone access denied. Please allow microphone permission.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
  };

  const handleSend = async (e, voiceBase64 = null, spokenText = null) => {
    if (e) e.preventDefault();
    // Use browser-transcribed text if available, otherwise use text input
    const text = spokenText || (voiceBase64 ? null : input.trim());
    if ((!text && !voiceBase64) || loading) return;

    if (!voiceBase64) setInput('');
    setError('');
    setLoading(true);
    setSource(null);

    const userMsg = spokenText
      ? `🎤 ${spokenText}`
      : voiceBase64
        ? '🎤 [Voice message]'
        : input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const body = voiceBase64
        ? { voiceData: voiceBase64 }
        : { message: text };

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      if (data.chatId)   setChatId(data.chatId);
      if (data.source)    setSource(data.source);
      if (typeof data.similarity === 'number') setSimilarity(data.similarity);
      if (data.category)  setCategory(data.category);

      const aiMsg = `**Q:** ${data.question}\n\n**A:** ${data.reply}`;
      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg }]);

      if (onFaqCreated && data.isNew) onFaqCreated(data);
    } catch (err) {
      setError(err.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI FAQ Assistant</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Ask questions → instant answers, auto-added to the knowledge base.
          </p>
        </div>
        <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full font-medium flex items-center gap-1">
          <Zap size={12} />
          Qwen2.5 3B
        </span>
      </div>

      {/* Source badge */}
      {source && (
        <div className={`mb-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
          source === 'existing'
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        }`}>
          {source === 'existing'
            ? <>♻️ Existing FAQ found — {Math.round(similarity * 100)}% match</>
            : <>✨ New FAQ created and added to the knowledge base</>
          }
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Zap size={48} className="text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 text-lg font-medium">Ask anything</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              Type or tap the mic to ask. Get instant answers — existing FAQs reused if similar, new ones auto-generated.
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
              {(msg.role === 'assistant'
                ? <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                : <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
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
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
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

        {/* Mic */}
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`shrink-0 p-3 rounded-full transition-colors ${
            recording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={recording ? 'Stop recording' : 'Voice input'}
        >
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="btn-primary px-5 shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}