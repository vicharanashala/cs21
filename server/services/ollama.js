const OLLAMA_BASE  = 'http://localhost:11434';
const LLM_MODEL    = 'qwen2.5:latest';
const EMBED_MODEL  = 'nomic-embed-text';

function ollamaFetch(path, body) {
  return fetch(`${OLLAMA_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => {
    if (!r.ok) throw new Error(`Ollama ${path} failed: ${r.status}`);
    return r.json();
  });
}

/** Generate a formal FAQ answer using Qwen2.5 */
async function generateAnswer(userQuery, conversationHistory = []) {
  const systemPrompt = `You are a professional FAQ answer generator for "Crowd FAQ" — a community knowledge portal.
Generate a formal, concise, accurate answer (2-4 sentences, max 1 short paragraph).
Tone: professional, non-conversational, factual.
Never say "I am" or "As an AI". Just answer directly.
If a question is unclear, make a reasonable professional interpretation.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user',   content: userQuery },
  ];

  const res = await ollamaFetch('/api/chat', {
    model: LLM_MODEL,
    messages,
    stream: false,
    options: { num_gpu: 100 },  // prefer Metal GPU
  });

  return (res.message?.content || '').trim();
}

/** Detect the best FAQ category from a question */
async function detectCategory(userQuery) {
  const res = await ollamaFetch('/api/chat', {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: 'Respond with ONLY the single best category name from this list: AI/ML, Programming, Finance, Education, Healthcare, Cloud/DevOps, Design, General. Nothing else.' },
      { role: 'user', content: userQuery },
    ],
    stream: false,
    options: { temperature: 0.1, num_predict: 20 },
  });

  const raw = (res.message?.content || '').trim();

  const valid  = ['AI/ML','Programming','Finance','Education','Healthcare','Cloud/DevOps','Design','General'];
  const found  = valid.find(c => raw.toLowerCase().includes(c.toLowerCase()));
  return found || 'General';
}

/** Generate text embedding via all-MiniLM-L6-v2 (384-dim) */
async function getEmbedding(text) {
  const res = await ollamaFetch('/api/embeddings', {
    model: EMBED_MODEL,
    prompt: text,
  });
  return res.embedding;
}

/** Transcribe audio to text using Whisper (Ollama) */
async function transcribeAudio(buffer) {
  // Write audio to temp file — whisper model expects a file path or FormData with file
  const fs   = require('fs');
  const path = `/tmp/whisper-${Date.now()}.wav`;
  fs.writeFileSync(path, buffer);

  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fs.createReadStream(path), {
    filename: 'audio.wav',
    contentType: 'audio/wav',
  });

  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/audio/transcriptions`, {
      method: 'POST',
      body: form,
    });
  } finally {
    fs.unlinkSync(path);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Whisper transcription failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return (data.text || '').trim();
}

module.exports = { generateAnswer, detectCategory, getEmbedding, transcribeAudio };