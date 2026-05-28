const OpenAI = require('openai');

const MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.7;

// Lazy-load client so server starts without a valid key
let _client;
function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * Generate an AI response using OpenAI Chat Completions API.
 * Supports multi-message conversation history for context.
 */
async function generateAIResponse(userMessage, conversationHistory = []) {
  const client = getClient();

  const systemPrompt = `You are a helpful AI assistant for "Crowd FAQ" — a community-driven FAQ knowledge portal.
Your job is to answer user questions clearly, accurately, and concisely.
When possible, reference real concepts and provide practical examples.
Keep answers focused and under 3-4 sentences unless the question requires detail.
Never claim to browse the live web. If unsure, say so honestly.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });

  return completion.choices[0].message.content.trim();
}

module.exports = { generateAIResponse };