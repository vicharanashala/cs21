/**
 * Translation service — generates all 8-language FAQ content.
 * Uses Ollama (qwen2.5:3b by default) as the translation engine.
 * Falls back to English when a translation fails.
 *
 * Each FAQ stores translations as a Map: { en: {question, answer}, hi: {...}, ... }
 * English is always the source of truth; all other languages are generated.
 */

const LANGUAGES = [
  { code: 'en', name: 'English',    native: 'English',    flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Spanish',    native: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French',     native: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic',     native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: 'Chinese',    native: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', name: 'German',     native: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português',  flag: '🇧🇷', dir: 'ltr' },
];

const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL       = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

const TARGET_LANGS = [
  { code: 'hi', name: 'Hindi',      prompt_name: 'Hindi',           system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'es', name: 'Spanish',    prompt_name: 'Spanish',         system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'fr', name: 'French',     prompt_name: 'French',          system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'ar', name: 'Arabic',     prompt_name: 'Arabic',          system_hint: 'أنت مترجم محترف.قدم الترجمة فقط، ولا شيء آخر.' },
  { code: 'zh', name: 'Chinese (Simplified)', prompt_name: 'Chinese (Simplified)', system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'de', name: 'German',     prompt_name: 'German',          system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'pt', name: 'Portuguese', prompt_name: 'Portuguese',      system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
];

// ── Core API ─────────────────────────────────────────────────────────────────

/**
 * Translate a { question, answer } pair into all 7 non-English languages.
 * Uses all 7 calls in parallel for speed.
 *
 * Returns { hi: { question, answer }, es: {...}, ... }
 */
async function translateFAQ({ question, answer }, skipCode = 'en') {
  const pending = TARGET_LANGS.filter(l => l.code !== skipCode);

  const results = {};
  const settled  = await Promise.allSettled(
    pending.map(lang =>
      translatePair({ question, answer }, lang)
        .then(t => { results[lang.code] = t; })
        .catch(err => {
          console.error(`[translation] ${lang.code} failed:`, err.message);
          results[lang.code] = { question: question, answer: answer };
        })
    )
  );

  const failed = settled.filter(s => s.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`[translation] ${failed}/${pending.length} languages failed — using English fallback`);
  }

  return results;
}

/**
 * Translate both question and answer for one language concurrently.
 */
async function translatePair({ question, answer }, lang) {
  const [q, a] = await Promise.all([
    translateText(question, lang, 'question'),
    translateText(answer,   lang, 'answer'),
  ]);
  return { question: q, answer: a };
}

/**
 * Translate a single string with up to `retries` attempts.
 * type: 'question' | 'answer'
 */
async function translateText(text, lang, type = 'question', retries = 2) {
  const isQuestion = type === 'question';
  const prompt = isQuestion
    ? `Translate this FAQ question to ${lang.prompt_name}. Keep it concise (under 80 characters for questions). Provide ONLY the translation text, no quotes, no explanations, no code blocks.\n\n"${text}"`
    : `Translate this FAQ answer to ${lang.prompt_name}. Keep it concise and professional (2-4 sentences max). Provide ONLY the translation text, no quotes, no explanations, no code blocks.\n\n"${text}"`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: lang.system_hint },
            { role: 'user',   content: prompt },
          ],
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: isQuestion ? 80 : 350,
          },
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Ollama ${res.status}: ${txt}`);
      }

      const data    = await res.json();
      let translated = (data.message?.content || '').trim();

      // Strip markdown code fences if Ollama wraps output
      translated = translated.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
      if (translated.startsWith('"') && translated.endsWith('"')) {
        translated = translated.slice(1, -1).trim();
      }

      if (!translated) throw new Error('Empty translation returned');

      return translated;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[translation] ${lang.code}/${type} attempt ${attempt} failed — retrying…`);
      await sleep(800 * attempt);
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Generate translations in the background and update the DB record.
 * Sets translationStatus to 'partial' immediately, then 'complete' when done.
 * Does NOT throw — fires and forgets.
 */
async function generateTranslationsAsync(faqId) {
  const FAQ = require('../models/FAQ');

  try {
    // Mark as partial so the UI can show progress
    await FAQ.findByIdAndUpdate(faqId, { translationStatus: 'partial' });

    const faq = await FAQ.findById(faqId).lean();
    if (!faq) return;

    const source = { question: faq.question, answer: faq.answer };
    const results = await translateFAQ(source, 'en');

    // Build translations Map
    const translations = new Map();
    translations.set('en', { question: faq.question, answer: faq.answer });
    for (const [code, text] of Object.entries(results)) {
      translations.set(code, text);
    }

    await FAQ.findByIdAndUpdate(faqId, {
      translations,
      translationStatus: 'complete',
    });

    const langCount = translations.size;
    console.log(`[translation] ✅ FAQ ${faqId}: ${langCount}/8 languages ready`);
  } catch (err) {
    console.error(`[translation] ❌ Background generation failed for FAQ ${faqId}:`, err.message);
    try {
      await FAQ.findByIdAndUpdate(faqId, { translationStatus: 'failed' });
    } catch { /* ignore */ }
  }
}

/**
 * Re-generate a single language for an existing FAQ (for manual corrections).
 */
async function translateOneLanguage(faqId, langCode) {
  const FAQ = require('../models/FAQ');
  const faq = await FAQ.findById(faqId).lean();
  if (!faq) throw new Error('FAQ not found');

  const langDef = TARGET_LANGS.find(l => l.code === langCode);
  if (!langDef) throw new Error(`Unsupported language: ${langCode}`);

  const result = await translatePair({ question: faq.question, answer: faq.answer }, langDef);

  const translations = faq.translations instanceof Map
    ? new Map(faq.translations)
    : new Map(Object.entries(faq.translations || {}));
  translations.set(langCode, result);

  await FAQ.findByIdAndUpdate(faqId, { translations });
  return result;
}

module.exports = {
  translateFAQ,
  translatePair,
  translateText,
  translateOneLanguage,
  generateTranslationsAsync,
  LANGUAGES,
  TARGET_LANGS,
};