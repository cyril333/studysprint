// ============================================================
// StudySprint - AI Quiz & Summary Generator (FR-003)
// ============================================================
// Supports external Gemini LLM API when GEMINI_API_KEY is set,
// and falls back to a deterministic NLP Concept & Cloze Engine
// that synthesizes questions directly from the student's notes.
// ============================================================

const STOP_WORDS = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
  'his', 'from', 'they', 'say', 'her', 'she', 'will', 'one', 'all', 'would',
  'there', 'their', 'what', 'out', 'about', 'who', 'get', 'which', 'when',
  'make', 'can', 'like', 'time', 'just', 'him', 'know', 'take', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
  'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does',
  'did', 'such', 'each', 'more', 'very', 'between', 'through', 'during'
]);

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Call Gemini API if GEMINI_API_KEY is configured in environment.
 */
async function generateWithGemini(noteTitle, noteContent, count) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are StudySprint AI. Given the following student study notes titled "${noteTitle}", generate:
1. A concise 2-3 sentence summary of the notes.
2. Exactly ${count} multiple-choice practice questions based strictly on the notes.

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "...",
  "questions": [
    {
      "prompt": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}

Study Notes:
${noteContent.slice(0, 12000)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API returned ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response from Gemini API');

  const parsed = JSON.parse(rawText);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Invalid questions format from Gemini API');
  }

  return {
    provider: 'gemini-api',
    summary: parsed.summary || '',
    questions: parsed.questions.slice(0, count)
  };
}

/**
 * Deterministic NLP / Text-Analysis Quiz Generator.
 * Extracts sentences, definitions, and key vocabulary from the student's actual notes.
 */
function generateLocallyFromNotes(noteTitle, noteContent, count = 10) {
  const cleaned = noteContent.replace(/\r\n/g, '\n').trim();
  const rawSentences = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((s) => s.length >= 20);

  // Fallback sentence splitting if notes are comma/semicolon heavy
  const sentences = rawSentences.length >= 3
    ? rawSentences
    : cleaned.split(/[;\n]+/).map((s) => s.trim()).filter((s) => s.length >= 15);

  // Extract candidate key terms (capitalized phrases or meaningful words >= 5 chars)
  const words = cleaned.match(/\b[A-Za-z][A-Za-z0-9-]{3,}\b/g) || [];
  const freq = {};
  for (const w of words) {
    const lower = w.toLowerCase();
    if (!STOP_WORDS.has(lower)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const vocabulary = Object.keys(freq).sort((a, b) => freq[b] - freq[a]);
  const fallbackDistractors = [
    'Asynchronous Polling',
    'Linear Buffer',
    'Static Allocation',
    'Manual Indexing',
    'Redundant Schema',
    'Sequential Cache',
    'Stateful Gateway',
    'Implicit Binding'
  ];

  function pickDistractors(correctTerm) {
    const pool = vocabulary.filter(
      (w) => w.toLowerCase() !== correctTerm.toLowerCase() && w.length >= 4
    );
    const chosen = [];
    for (const candidate of shuffleArray(pool)) {
      if (chosen.length >= 3) break;
      if (!chosen.some((c) => c.toLowerCase() === candidate.toLowerCase())) {
        chosen.push(candidate);
      }
    }
    for (const fb of fallbackDistractors) {
      if (chosen.length >= 3) break;
      if (fb.toLowerCase() !== correctTerm.toLowerCase()) {
        chosen.push(fb);
      }
    }
    return chosen.slice(0, 3);
  }

  const questions = [];

  // Pass 1: Look for definition patterns ("X is Y", "X refers to Y", "X: Y")
  for (const sentence of sentences) {
    if (questions.length >= count) break;
    const defMatch = sentence.match(/^([A-Za-z0-9\s/-]{3,40}?)\s+(?:is|are|refers to|means|represents|:)\s+(.{15,})$/i);
    if (defMatch) {
      const term = defMatch[1].trim();
      const definition = defMatch[2].trim().replace(/\.$/, '');
      const distractors = pickDistractors(term);
      const options = shuffleArray([term, ...distractors]);
      questions.push({
        prompt: `According to "${noteTitle}", which concept ${sentence.includes(':') ? 'matches the description' : 'is described as'}: "${definition}"?`,
        options,
        correctIndex: options.indexOf(term),
        explanation: `From your notes: "${sentence}"`
      });
    }
  }

  // Pass 2: Cloze (fill-in-the-blank) questions from key sentences
  let idx = 0;
  while (questions.length < count && sentences.length > 0 && idx < sentences.length * 3) {
    const sentence = sentences[idx % sentences.length];
    idx++;

    const sentenceWords = (sentence.match(/\b[A-Za-z][A-Za-z0-9-]{4,}\b/g) || [])
      .filter((w) => !STOP_WORDS.has(w.toLowerCase()));

    if (sentenceWords.length === 0) continue;

    // Pick a distinct keyword for this pass
    const targetWord = sentenceWords[(idx + questions.length) % sentenceWords.length];
    const maskedSentence = sentence.replace(new RegExp(`\\b${targetWord}\\b`), '________');

    // Avoid exact duplicate prompts
    if (questions.some((q) => q.prompt.includes(maskedSentence))) {
      continue;
    }

    const distractors = pickDistractors(targetWord);
    const options = shuffleArray([targetWord, ...distractors]);

    questions.push({
      prompt: `Complete the statement from your notes: "${maskedSentence}"`,
      options,
      correctIndex: options.indexOf(targetWord),
      explanation: `Original note statement: "${sentence}"`
    });
  }

  // Pass 3: If notes were very brief, synthesize comprehension/key-term questions
  let extraIdx = 0;
  while (questions.length < count) {
    const keyTerm = vocabulary[extraIdx % Math.max(vocabulary.length, 1)] || noteTitle;
    const refSentence = sentences[extraIdx % Math.max(sentences.length, 1)] || cleaned.slice(0, 120);
    extraIdx++;

    const distractors = pickDistractors(keyTerm);
    const options = shuffleArray([keyTerm, ...distractors]);
    questions.push({
      prompt: `Question ${questions.length + 1} (${noteTitle}): Which key term is emphasized in the study material regarding "${refSentence.slice(0, 75)}${refSentence.length > 75 ? '...' : ''}"?`,
      options,
      correctIndex: options.indexOf(keyTerm),
      explanation: `Key term "${keyTerm}" appears in your "${noteTitle}" notes.`
    });
  }

  const summarySentences = sentences.slice(0, 2).join(' ');
  const summary = summarySentences
    ? `Summary of ${noteTitle}: ${summarySentences}`
    : `Summary of ${noteTitle}: Covers ${vocabulary.slice(0, 5).join(', ')}.`;

  return {
    provider: 'studysprint-nlp-engine',
    summary,
    questions: questions.slice(0, count)
  };
}

/**
 * Main entry point: generates a quiz of >= 10 questions from note content.
 */
async function generateQuizFromNote(noteTitle, noteContent, count = 10) {
  const safeCount = Math.max(10, Math.min(Number(count) || 10, 20));

  if (process.env.GEMINI_API_KEY) {
    try {
      return await generateWithGemini(noteTitle, noteContent, safeCount);
    } catch (err) {
      console.warn('[QuizGenerator] External LLM failed, falling back to local NLP engine:', err.message);
    }
  }

  return generateLocallyFromNotes(noteTitle, noteContent, safeCount);
}

module.exports = { generateQuizFromNote };
