/**
 * Translation service — uses Ollama (qwen2.5:3b) to generate
 * 8-language multilingual FAQ content.
 *
 * Each FAQ stores translations as a Map: { en: {question, answer}, hi: {...}, ... }
 * The "master" (English) is always the primary field; all other languages are
 * stored under their ISO code.
 */

// LANGUAGES — shared with the FAQ model; keep in sync
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
const MODEL       = 'qwen2.5:3b';

const TARGET_LANGS = [
  { code: 'hi', name: 'Hindi',      prompt_name: 'Hindi',      system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'es', name: 'Spanish',    prompt_name: 'Spanish',    system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'fr', name: 'French',     prompt_name: 'French',     system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'ar', name: 'Arabic',     prompt_name: 'Arabic',     system_hint: 'أنت مترجم محترف.قدم الترجمة فقط، ولا شيء آخر.' },
  { code: 'zh', name: 'Chinese',    prompt_name: 'Chinese (Simplified)', system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'de', name: 'German',     prompt_name: 'German',     system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
  { code: 'pt', name: 'Portuguese', prompt_name: 'Portuguese', system_hint: 'You are a professional translator. Provide ONLY the translation, nothing else.' },
];

// ── Core API ─────────────────────────────────────────────────────────────────

/**
 * Translate a single { question, answer } pair into all 8 target languages.
 * Skips `skipCode` (the source language to keep as-is, typically 'en').
 *
 * Returns { code: { question, answer } }
 */
async function translateFAQ({ question, answer }, skipCode = 'en') {
  const results = {};

  await Promise.allSettled(
    TARGET_LANGS
      .filter(l => l.code !== skipCode)
      .map(lang =>
        translatePair({ question, answer }, lang)
          .then(t => { results[lang.code] = t; })
          .catch(err => {
            console.error(`[translation] ${lang.code} failed:`, err.message);
            results[lang.code] = { question: question, answer: answer }; // fallback to English
          })
      )
  );

  return results;
}

/**
 * Translate one language pair.
 * Generates question and answer independently to keep each concise.
 */
async function translatePair({ question, answer }, lang) {
  const [q, a] = await Promise.all([
    translateText(question, lang, 'question'),
    translateText(answer,   lang, 'answer'),
  ]);

  return { question: q, answer: a };
}

/**
 * Translate a single string fragment (question or answer).
 * type: 'question' | 'answer' — affects prompt framing.
 */
async function translateText(text, lang, type = 'question') {
  const isQuestion = type === 'question';
  const prompt = isQuestion
    ? `Translate this FAQ question to ${lang.prompt_name}. Keep it concise (under 80 characters for questions). Provide ONLY the translation, no quotes or explanations.\n\n"${text}"`
    : `Translate this FAQ answer to ${lang.prompt_name}. Keep it concise and professional (2-4 sentences max). Provide ONLY the translation, no quotes or explanations.\n\n"${text}"`;

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
        num_predict: isQuestion ? 80 : 300,
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Ollama translation (${lang.code}/${type}) failed ${res.status}: ${txt}`);
  }

  const data = await res.json();
  let translated = (data.message?.content || '').trim();

  // Strip surrounding quotes if Ollama adds them
  if (translated.startsWith('"') && translated.endsWith('"')) {
    translated = translated.slice(1, -1).trim();
  }

  return translated;
}

/**
 * Generate translations for a FAQ in the background, updating the DB record.
 * Does NOT throw — fires and forgets.
 */
async function generateTranslationsAsync(faqId) {
  try {
    const FAQ = require('../models/FAQ');
    const faq = await FAQ.findById(faqId).lean();
    if (!faq) return;

    const source = { question: faq.question, answer: faq.answer };

    // Queue all 7 non-English translations concurrently
    const results = await translateFAQ(source, 'en');

    // Build the translations map
    const translations = new Map();
    translations.set('en', { question: faq.question, answer: faq.answer });
    for (const [code, text] of Object.entries(results)) {
      translations.set(code, text);
    }

    await FAQ.findByIdAndUpdate(faqId, {
      translations,
      translationStatus: 'complete',
    });

    console.log(`[translation] FAQ ${faqId}: ${translations.size}/${1 + TARGET_LANGS.length} languages ready`);
  } catch (err) {
    console.error(`[translation] Background generation failed for FAQ ${faqId}:`, err.message);
    try {
      const FAQ = require('../models/FAQ');
      await FAQ.findByIdAndUpdate(faqId, { translationStatus: 'failed' });
    } catch { /* ignore */ }
  }
}

module.exports = {
  translateFAQ,
  translatePair,
  translateText,
  generateTranslationsAsync,
  LANGUAGES,
};